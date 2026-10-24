import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.enums import UserRole
from app.services.video_analysis_service import VideoAnalysisService

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


def setup_player_profile(email: str, name: str, sport: str = "Badminton") -> tuple[str, int]:
    token = get_auth_token(email, "Pass123!", name, UserRole.PLAYER.value)
    headers = {"Authorization": f"Bearer {token}"}
    prof_resp = client.post("/api/v1/players/profile", json={
        "sport": sport,
        "position": "Singles",
        "age": 20
    }, headers=headers)
    if prof_resp.status_code == 201:
        player_id = prof_resp.json()["data"]["id"]
    else:
        me_resp = client.get("/api/v1/players/profile/me", headers=headers)
        player_id = me_resp.json()["data"]["id"]
    return token, player_id


def test_valid_video_passes_validation_and_generates_pros_cons():
    """Test a valid video passes all gates and generates structured strengths and weaknesses."""
    token, player_id = setup_player_profile("pv.sindhu@sportiq.ai", "PV Sindhu", "Badminton")
    headers = {"Authorization": f"Bearer {token}"}

    fake_video = io.BytesIO(b"valid high quality 1080p 60fps badminton footwork drill footage")
    upload_resp = client.post(
        "/api/v1/video-assessments/upload",
        data={
            "sport": "Badminton",
            "assessment_type": "Footwork",
            "notes": "Clear 6-corner court shadow footwork with optimal indoor lighting."
        },
        files={"file": ("badminton_footwork_drill.mp4", fake_video, "video/mp4")},
        headers=headers
    )
    assert upload_resp.status_code == 201
    assessment_id = upload_resp.json()["data"]["id"]

    detail_resp = client.get(f"/api/v1/video-assessments/{assessment_id}", headers=headers)
    assert detail_resp.status_code == 200
    detail = detail_resp.json()["data"]

    # Validation must be VALIDATED
    assert detail["validation_status"] == "VALIDATED"
    assert "Video Validated" in detail["validation_reason"]
    assert detail["athletes_detected_count"] == 1
    assert detail["athlete_visibility_score"] > 80.0
    assert detail["processing_status"] == "COMPLETED"

    # Analysis Result with structured pros and cons
    ar = detail["analysis_result"]
    assert ar is not None
    assert 60.0 <= ar["overall_score"] <= 100.0
    assert ar["analysis_confidence"] >= 70.0

    # Verify structured strengths
    assert len(ar["structured_strengths"]) >= 1
    first_strength = ar["structured_strengths"][0]
    assert "name" in first_strength
    assert "observation" in first_strength
    assert "why_it_matters" in first_strength
    assert "Badminton" in first_strength["why_it_matters"]

    # Verify structured weaknesses / areas to improve
    assert len(ar["structured_weaknesses"]) >= 1
    first_weakness = ar["structured_weaknesses"][0]
    assert "area" in first_weakness
    assert "observation" in first_weakness
    assert "recommendation" in first_weakness

    # Verify unobservable metrics are flagged
    metrics = ar["observable_metrics"]
    hr_metric = next(m for m in metrics if m["metric_name"] == "Heart Rate")
    assert hr_metric["is_observable"] is False
    assert hr_metric["value"] is None
    assert "Not available" in hr_metric["status_note"]


def test_sport_mismatch_rejection():
    """Test video rejection when uploaded video sport does not match selected sport."""
    token, player_id = setup_player_profile("saina.nehwal@sportiq.ai", "Saina Nehwal", "Badminton")
    headers = {"Authorization": f"Bearer {token}"}

    fake_video = io.BytesIO(b"football soccer video data")
    upload_resp = client.post(
        "/api/v1/video-assessments/upload",
        data={
            "sport": "Badminton",
            "assessment_type": "Footwork",
            "notes": "Uploaded football match highlights video by accident."
        },
        files={"file": ("football_video.mp4", fake_video, "video/mp4")},
        headers=headers
    )
    assert upload_resp.status_code == 201
    assessment_id = upload_resp.json()["data"]["id"]

    detail_resp = client.get(f"/api/v1/video-assessments/{assessment_id}", headers=headers)
    assert detail_resp.status_code == 200
    detail = detail_resp.json()["data"]

    # Validation must REJECT due to sport mismatch
    assert detail["validation_status"] == "REJECTED"
    assert "Sport Mismatch" in detail["validation_reason"]
    assert detail["processing_status"] == "FAILED"
    # MUST NOT generate performance score or analysis result!
    assert detail["analysis_result"] is None


def test_assessment_drill_mismatch_rejection():
    """Test video rejection when uploaded drill does not match selected assessment type."""
    token, player_id = setup_player_profile("lakshya.sen@sportiq.ai", "Lakshya Sen", "Badminton")
    headers = {"Authorization": f"Bearer {token}"}

    fake_video = io.BytesIO(b"smash jump takeoff data")
    upload_resp = client.post(
        "/api/v1/video-assessments/upload",
        data={
            "sport": "Badminton",
            "assessment_type": "Footwork",
            "notes": "Testing doing smash practice jump."
        },
        files={"file": ("smash_practice_clip.mp4", fake_video, "video/mp4")},
        headers=headers
    )
    assessment_id = upload_resp.json()["data"]["id"]
    detail = client.get(f"/api/v1/video-assessments/{assessment_id}", headers=headers).json()["data"]

    assert detail["validation_status"] == "REJECTED"
    assert "Assessment Drill Mismatch" in detail["validation_reason"]
    assert detail["analysis_result"] is None


def test_short_video_duration_rejection():
    """Test video rejection when duration is under 3 seconds."""
    token, player_id = setup_player_profile("satwik.sairaj@sportiq.ai", "Satwik Sairaj", "Badminton")
    headers = {"Authorization": f"Bearer {token}"}

    fake_video = io.BytesIO(b"1 second snippet")
    upload_resp = client.post(
        "/api/v1/video-assessments/upload",
        data={
            "sport": "Badminton",
            "assessment_type": "Smash Practice",
            "notes": "1s quick clip."
        },
        files={"file": ("short_1s.mp4", fake_video, "video/mp4")},
        headers=headers
    )
    assessment_id = upload_resp.json()["data"]["id"]
    detail = client.get(f"/api/v1/video-assessments/{assessment_id}", headers=headers).json()["data"]

    assert detail["validation_status"] == "REJECTED"
    assert "Insufficient Video Duration" in detail["validation_reason"]
    assert detail["analysis_result"] is None


def test_poor_quality_dark_blur_rejection():
    """Test video rejection when lighting is dark or image is blurry."""
    token, player_id = setup_player_profile("chirag.shetty@sportiq.ai", "Chirag Shetty", "Badminton")
    headers = {"Authorization": f"Bearer {token}"}

    fake_video = io.BytesIO(b"dark video footage")
    upload_resp = client.post(
        "/api/v1/video-assessments/upload",
        data={
            "sport": "Badminton",
            "assessment_type": "Agility",
            "notes": "Recorded in dark night room with blurry camera shake."
        },
        files={"file": ("dark_blurry_video.mp4", fake_video, "video/mp4")},
        headers=headers
    )
    assessment_id = upload_resp.json()["data"]["id"]
    detail = client.get(f"/api/v1/video-assessments/{assessment_id}", headers=headers).json()["data"]

    assert detail["validation_status"] == "REJECTED"
    assert "Video Quality Insufficient" in detail["validation_reason"]
    assert detail["analysis_result"] is None


def test_no_athlete_detected_rejection():
    """Test video rejection when no human athlete is detected in frame."""
    token, player_id = setup_player_profile("neeraj.chopra@sportiq.ai", "Neeraj Chopra", "Athletics")
    headers = {"Authorization": f"Bearer {token}"}

    fake_video = io.BytesIO(b"empty grass field scenery")
    upload_resp = client.post(
        "/api/v1/video-assessments/upload",
        data={
            "sport": "Athletics",
            "assessment_type": "Running Form",
            "notes": "Empty ground only scenery view."
        },
        files={"file": ("no_athlete_scenery.mp4", fake_video, "video/mp4")},
        headers=headers
    )
    assessment_id = upload_resp.json()["data"]["id"]
    detail = client.get(f"/api/v1/video-assessments/{assessment_id}", headers=headers).json()["data"]

    assert detail["validation_status"] == "REJECTED"
    assert "No Athlete Detected" in detail["validation_reason"]
    assert detail["analysis_result"] is None


def test_multiple_athletes_detected_rejection():
    """Test video rejection when multiple athletes make tracking ambiguous."""
    token, player_id = setup_player_profile("sunil.chhetri@sportiq.ai", "Sunil Chhetri", "Football")
    headers = {"Authorization": f"Bearer {token}"}

    fake_video = io.BytesIO(b"crowd team drill footage")
    upload_resp = client.post(
        "/api/v1/video-assessments/upload",
        data={
            "sport": "Football",
            "assessment_type": "Dribbling",
            "notes": "Full team scrimmage crowd on pitch."
        },
        files={"file": ("crowd_multi_players.mp4", fake_video, "video/mp4")},
        headers=headers
    )
    assessment_id = upload_resp.json()["data"]["id"]
    detail = client.get(f"/api/v1/video-assessments/{assessment_id}", headers=headers).json()["data"]

    assert detail["validation_status"] == "REJECTED"
    assert "Multiple Athletes Detected" in detail["validation_reason"]
    assert detail["analysis_result"] is None


def test_insufficient_evidence_confidence_gate():
    """Test video marked as INSUFFICIENT_EVIDENCE when confidence is below 70% threshold."""
    token, player_id = setup_player_profile("rohit.sharma@sportiq.ai", "Rohit Sharma", "Cricket")
    headers = {"Authorization": f"Bearer {token}"}

    fake_video = io.BytesIO(b"partially obscured batting footage")
    upload_resp = client.post(
        "/api/v1/video-assessments/upload",
        data={
            "sport": "Cricket",
            "assessment_type": "Batting Stroke",
            "notes": "Partially blocked net view with low confidence."
        },
        files={"file": ("partially_blocked_drill.mp4", fake_video, "video/mp4")},
        headers=headers
    )
    assessment_id = upload_resp.json()["data"]["id"]
    detail = client.get(f"/api/v1/video-assessments/{assessment_id}", headers=headers).json()["data"]

    assert detail["validation_status"] == "INSUFFICIENT_EVIDENCE"
    assert "Insufficient Evidence" in detail["validation_reason"]
    assert detail["analysis_result"] is None
