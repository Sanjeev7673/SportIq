import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.enums import UserRole
from app.services.video_analysis_service import VideoAnalysisService

client = TestClient(app)


def get_auth_token(email: str, password: str, name: str, role: str) -> str:
    """Helper to register/login and return bearer token."""
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


def setup_player_and_get_id(email: str, name: str, sport: str = "Football") -> tuple[str, int]:
    """Helper to register player, create athletic profile, and return (token, player_id)."""
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


def test_get_assessment_catalog():
    """Verify sport-specific assessment catalog returns multiple sports and drill types."""
    resp = client.get("/api/v1/video-assessments/types")
    assert resp.status_code == 200
    data = resp.json()["data"]
    sports = [item["sport"] for item in data]
    assert "Football" in sports
    assert "Badminton" in sports
    assert "Tennis" in sports
    assert "Basketball" in sports
    assert "Cricket" in sports
    assert "Athletics" in sports

    football_item = next(item for item in data if item["sport"] == "Football")
    drill_names = [d["name"] for d in football_item["assessment_types"]]
    assert "Sprint" in drill_names
    assert "Agility" in drill_names
    assert "Dribbling" in drill_names


def test_video_upload_and_background_analysis_flow():
    """Verify player uploading video assessment and subsequent async analysis result generation."""
    token, player_id = setup_player_and_get_id("lamine.yamal@sportiq.ai", "Lamine Yamal", "Football")
    headers = {"Authorization": f"Bearer {token}"}

    fake_video = io.BytesIO(b"mp4 binary video simulation stream data")

    # 1. Upload Video Assessment
    upload_resp = client.post(
        "/api/v1/video-assessments/upload",
        data={
            "sport": "Football",
            "assessment_type": "Dribbling",
            "notes": "Fast close-control slalom drill with 6 cones."
        },
        files={"file": ("dribbling_drill.mp4", fake_video, "video/mp4")},
        headers=headers
    )
    assert upload_resp.status_code == 201
    assessment_data = upload_resp.json()["data"]
    assessment_id = assessment_data["id"]
    assert assessment_data["sport"] == "Football"
    assert assessment_data["assessment_type"] == "Dribbling"
    assert assessment_data["processing_status"] == "UPLOADED"
    assert "video_" in assessment_data["video_url"]

    # 2. Execute background processing task
    VideoAnalysisService.process_video_background_task(assessment_id)

    # 3. Retrieve assessment detail
    detail_resp = client.get(f"/api/v1/video-assessments/{assessment_id}", headers=headers)
    assert detail_resp.status_code == 200
    detail = detail_resp.json()["data"]
    assert detail["processing_status"] == "COMPLETED"
    assert detail["analysis_result"] is not None

    result = detail["analysis_result"]
    assert 60.0 <= result["overall_score"] <= 100.0
    assert 80.0 <= result["analysis_confidence"] <= 100.0
    assert result["video_quality_status"] == "OPTIMAL"
    assert result["movement_score"] > 0
    assert result["technique_score"] > 0
    assert result["consistency_score"] > 0
    assert "Dribbling" in result["strengths"] or "dribbling" in result["strengths"]


def test_coach_and_scout_view_athlete_video_assessment():
    """Verify coach and scout can view athlete's completed video assessment while maintaining privacy."""
    token, player_id = setup_player_and_get_id("pedri.gonzalez@sportiq.ai", "Pedri Gonzalez", "Football")
    headers = {"Authorization": f"Bearer {token}"}

    fake_video = io.BytesIO(b"mp4 binary video simulation stream data")
    upload_resp = client.post(
        "/api/v1/video-assessments/upload",
        data={
            "sport": "Football",
            "assessment_type": "Agility",
            "notes": "Agility ladder in-out rhythm."
        },
        files={"file": ("agility_ladder.mp4", fake_video, "video/mp4")},
        headers=headers
    )
    assessment_id = upload_resp.json()["data"]["id"]
    VideoAnalysisService.process_video_background_task(assessment_id)

    # Coach accesses player assessments
    coach_token = get_auth_token("xavi.hernandez@sportiq.ai", "Pass123!", "Xavi Hernandez", UserRole.COACH.value)
    coach_headers = {"Authorization": f"Bearer {coach_token}"}
    coach_resp = client.get(f"/api/v1/video-assessments/player/{player_id}", headers=coach_headers)
    assert coach_resp.status_code == 200
    coach_data = coach_resp.json()["data"]
    assert len(coach_data["assessments"]) >= 1
    assert coach_data["assessments"][0]["id"] == assessment_id
    assert coach_data["assessments"][0]["analysis_result"]["overall_score"] > 0

    # Unauthorized player cannot access another player's assessment
    other_token, _ = setup_player_and_get_id("gavi.paez@sportiq.ai", "Gavi Paez", "Football")
    other_headers = {"Authorization": f"Bearer {other_token}"}
    forbidden_resp = client.get(f"/api/v1/video-assessments/{assessment_id}", headers=other_headers)
    assert forbidden_resp.status_code == 403
