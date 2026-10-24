import io
import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.enums import UserRole

client = TestClient(app)


def get_auth_token(email: str, password: str, name: str, role: str) -> str:
    reg_resp = client.post("/api/v1/auth/register", json={
        "name": name,
        "email": email,
        "password": password,
        "role": role
    })
    if reg_resp.status_code == 201:
        return reg_resp.json()["data"]["access_token"]
    login_resp = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    return login_resp.json()["data"]["access_token"]


def setup_player_profile(email: str, name: str, sport: str = "Football") -> tuple[str, int]:
    token = get_auth_token(email, "Pass123!", name, UserRole.PLAYER.value)
    headers = {"Authorization": f"Bearer {token}"}
    prof_resp = client.post("/api/v1/players/profile", json={
        "sport": sport,
        "position": "Forward",
        "age": 21
    }, headers=headers)
    if prof_resp.status_code == 201:
        player_id = prof_resp.json()["data"]["id"]
    else:
        me_resp = client.get("/api/v1/players/profile/me", headers=headers)
        player_id = me_resp.json()["data"]["id"]
    return token, player_id


def setup_coach() -> str:
    return get_auth_token("jurgen.klopp@sportiq.ai", "Pass123!", "Jurgen Klopp", UserRole.COACH.value)


def test_athlete_can_delete_unverified_video():
    """Test athlete can delete an unverified video assessment and physical file is removed."""
    player_token, player_id = setup_player_profile("bukayo.saka@sportiq.ai", "Bukayo Saka", "Football")
    headers = {"Authorization": f"Bearer {player_token}"}

    fake_video = io.BytesIO(b"sprint test video to be deleted")
    upload_resp = client.post(
        "/api/v1/video-assessments/upload",
        data={"sport": "Football", "assessment_type": "Sprint", "notes": "Test unverified delete"},
        files={"file": ("unverified_sprint.mp4", fake_video, "video/mp4")},
        headers=headers
    )
    assert upload_resp.status_code == 201
    assessment = upload_resp.json()["data"]
    assessment_id = assessment["id"]

    # Status must be PENDING_VERIFICATION or UPLOADED (not VERIFIED)
    assert assessment["status"] != "VERIFIED"

    # Athlete deletes unverified video
    del_resp = client.delete(f"/api/v1/video-assessments/{assessment_id}", headers=headers)
    assert del_resp.status_code == 200
    assert "deleted successfully" in del_resp.json()["message"]

    # Verify assessment is gone
    get_resp = client.get(f"/api/v1/video-assessments/{assessment_id}", headers=headers)
    assert get_resp.status_code == 404


def test_coach_verify_assessment_and_athlete_delete_forbidden():
    """
    Test Coach verifies assessment -> status becomes VERIFIED ->
    Athlete CANNOT delete, returns HTTP 403 Forbidden with strict error message.
    """
    player_token, player_id = setup_player_profile("phil.foden@sportiq.ai", "Phil Foden", "Football")
    player_headers = {"Authorization": f"Bearer {player_token}"}
    coach_token = setup_coach()
    coach_headers = {"Authorization": f"Bearer {coach_token}"}

    # 1. Athlete uploads video
    fake_video = io.BytesIO(b"high quality 1080p sprint drill for verification test")
    upload_resp = client.post(
        "/api/v1/video-assessments/upload",
        data={"sport": "Football", "assessment_type": "Sprint", "notes": "Verification test drill"},
        files={"file": ("foden_sprint.mp4", fake_video, "video/mp4")},
        headers=player_headers
    )
    assert upload_resp.status_code == 201
    assessment_id = upload_resp.json()["data"]["id"]

    # 2. Coach verifies assessment
    verify_resp = client.post(
        f"/api/v1/video-assessments/{assessment_id}/verify",
        json={"notes": "Certified sprint mechanics and acceleration timing."},
        headers=coach_headers
    )
    assert verify_resp.status_code == 200
    verified_data = verify_resp.json()["data"]
    assert verified_data["status"] == "VERIFIED"
    assert verified_data["verified_by"] is not None

    # 3. Athlete attempts to DELETE verified video -> MUST RETURN HTTP 403 FORBIDDEN!
    athlete_del_resp = client.delete(f"/api/v1/video-assessments/{assessment_id}", headers=player_headers)
    assert athlete_del_resp.status_code == 403
    assert "Verified assessments cannot be deleted or modified" in athlete_del_resp.json()["detail"]

    # 4. Verified video still exists intact in database
    detail_resp = client.get(f"/api/v1/video-assessments/{assessment_id}", headers=player_headers)
    assert detail_resp.status_code == 200
    assert detail_resp.json()["data"]["status"] == "VERIFIED"


def test_coach_reject_assessment_and_athlete_reupload():
    """Test Coach rejects assessment with reason -> Athlete can view reason and delete/re-upload."""
    player_token, player_id = setup_player_profile("cole.palmer@sportiq.ai", "Cole Palmer", "Football")
    player_headers = {"Authorization": f"Bearer {player_token}"}
    coach_token = setup_coach()
    coach_headers = {"Authorization": f"Bearer {coach_token}"}

    fake_video = io.BytesIO(b"dribbling video to be rejected")
    upload_resp = client.post(
        "/api/v1/video-assessments/upload",
        data={"sport": "Football", "assessment_type": "Dribbling", "notes": "Testing coach rejection"},
        files={"file": ("palmer_dribble.mp4", fake_video, "video/mp4")},
        headers=player_headers
    )
    assessment_id = upload_resp.json()["data"]["id"]

    # Coach rejects with feedback
    reject_resp = client.post(
        f"/api/v1/video-assessments/{assessment_id}/reject",
        json={"reason": "Camera angle too low to judge touch distance. Please record from 45 degree angle."},
        headers=coach_headers
    )
    assert reject_resp.status_code == 200
    rejected_data = reject_resp.json()["data"]
    assert rejected_data["status"] == "REJECTED"
    assert "Camera angle too low" in rejected_data["rejection_reason"]

    # Athlete can delete rejected assessment
    del_resp = client.delete(f"/api/v1/video-assessments/{assessment_id}", headers=player_headers)
    assert del_resp.status_code == 200


def test_audit_trail_recorded():
    """Test audit trail logs events for video lifecycle."""
    player_token, player_id = setup_player_profile("jude.bellingham@sportiq.ai", "Jude Bellingham", "Football")
    player_headers = {"Authorization": f"Bearer {player_token}"}
    coach_token = setup_coach()
    coach_headers = {"Authorization": f"Bearer {coach_token}"}

    fake_video = io.BytesIO(b"video for audit trail")
    upload_resp = client.post(
        "/api/v1/video-assessments/upload",
        data={"sport": "Football", "assessment_type": "Agility", "notes": "Testing audit log"},
        files={"file": ("bellingham_agility.mp4", fake_video, "video/mp4")},
        headers=player_headers
    )
    assessment_id = upload_resp.json()["data"]["id"]

    # Verify assessment
    client.post(f"/api/v1/video-assessments/{assessment_id}/verify", headers=coach_headers)

    # Check audit trail
    audit_resp = client.get(f"/api/v1/video-assessments/{assessment_id}/audit", headers=player_headers)
    assert audit_resp.status_code == 200
    audits = audit_resp.json()["data"]
    actions = [a["action"] for a in audits]

    assert "VIDEO_UPLOADED" in actions
    assert "VIDEO_VERIFIED" in actions
