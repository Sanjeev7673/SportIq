import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.enums import UserRole

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
        "age": 20
    }, headers=headers)
    if prof_resp.status_code == 201:
        player_id = prof_resp.json()["data"]["id"]
    else:
        me_resp = client.get("/api/v1/players/profile/me", headers=headers)
        player_id = me_resp.json()["data"]["id"]
    return token, player_id


def test_add_performance_by_player():
    token, player_id = setup_player_and_get_id("kylian.mbappe@sportiq.ai", "Kylian Mbappe", "Football")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "speed": 96.0,
        "stamina": 88.0,
        "strength": 80.0,
        "agility": 92.0,
        "accuracy": 85.0,
        "matches_played": 15,
        "assessment_date": "2026-08-01",
        "source_type": "STANDARDIZED_FIELD_TEST",
        "field_test_protocol": "30m Sprint"
    }

    response = client.post("/api/v1/performance", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["speed"] == 96.0
    assert data["data"]["player_id"] == player_id
    assert data["data"]["source_type"] == "STANDARDIZED_FIELD_TEST"
    assert data["data"]["verification_status"] == "UNVERIFIED"
    assert data["data"]["data_confidence_score"] >= 65.0


def test_add_performance_by_coach():
    _, player_id = setup_player_and_get_id("erling.haaland@sportiq.ai", "Erling Haaland", "Football")
    coach_token = get_auth_token("carlo.ancelotti@sportiq.ai", "Pass123!", "Carlo Ancelotti", UserRole.COACH.value)
    headers = {"Authorization": f"Bearer {coach_token}"}

    payload = {
        "player_id": player_id,
        "speed": 91.0,
        "stamina": 86.0,
        "strength": 95.0,
        "agility": 84.0,
        "accuracy": 92.0,
        "matches_played": 12,
        "assessment_date": "2026-08-10",
        "source_type": "COACH_VERIFIED"
    }

    response = client.post("/api/v1/performance", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["player_id"] == player_id
    assert data["data"]["strength"] == 95.0
    assert data["data"]["verification_status"] == "COACH_VERIFIED"
    assert data["data"]["data_confidence_score"] >= 90.0


def test_add_performance_by_scout_forbidden():
    _, player_id = setup_player_and_get_id("bukayo.saka@sportiq.ai", "Bukayo Saka", "Football")
    scout_token = get_auth_token("paul.mitchell@sportiq.ai", "Pass123!", "Paul Mitchell", UserRole.SCOUT.value)
    headers = {"Authorization": f"Bearer {scout_token}"}

    payload = {
        "player_id": player_id,
        "speed": 88.0,
        "stamina": 85.0,
        "strength": 78.0,
        "agility": 90.0,
        "accuracy": 84.0
    }

    response = client.post("/api/v1/performance", json=payload, headers=headers)
    assert response.status_code == 403


def test_get_performance_history_and_stats():
    token, player_id = setup_player_and_get_id("jude.bellingham@sportiq.ai", "Jude Bellingham", "Football")
    headers = {"Authorization": f"Bearer {token}"}

    # Add 2 records
    client.post("/api/v1/performance", json={
        "speed": 84.0, "stamina": 90.0, "strength": 82.0, "agility": 86.0, "accuracy": 88.0, "matches_played": 5, "assessment_date": "2026-07-01"
    }, headers=headers)

    client.post("/api/v1/performance", json={
        "speed": 88.0, "stamina": 94.0, "strength": 86.0, "agility": 90.0, "accuracy": 92.0, "matches_played": 10, "assessment_date": "2026-08-01"
    }, headers=headers)

    # Get history
    hist_resp = client.get(f"/api/v1/performance/player/{player_id}", headers=headers)
    assert hist_resp.status_code == 200
    hist_data = hist_resp.json()["data"]
    assert len(hist_data["records"]) == 2
    assert hist_data["summary"]["total_records"] == 2
    assert hist_data["summary"]["max_speed"] == 88.0
    assert hist_data["summary"]["avg_stamina"] == 92.0

    # Get dedicated stats
    stats_resp = client.get(f"/api/v1/performance/player/{player_id}/stats", headers=headers)
    assert stats_resp.status_code == 200
    stats_data = stats_resp.json()["data"]
    assert stats_data["total_matches_played"] == 15
    assert stats_data["avg_accuracy"] == 90.0


def test_upload_evidence_and_coach_verification():
    token, player_id = setup_player_and_get_id("vinicius.jr@sportiq.ai", "Vinicius Jr", "Football")
    headers = {"Authorization": f"Bearer {token}"}

    # Upload video proof
    fake_video = io.BytesIO(b"fake mp4 video bytes header payload")
    upload_resp = client.post(
        "/api/v1/performance/evidence",
        files={"file": ("sprint_trial.mp4", fake_video, "video/mp4")},
        headers=headers
    )
    assert upload_resp.status_code == 200
    evidence_url = upload_resp.json()["data"]["evidence_url"]
    assert "evidence_" in evidence_url

    # Add performance record with evidence
    add_resp = client.post("/api/v1/performance", json={
        "speed": 94.0,
        "stamina": 88.0,
        "strength": 78.0,
        "agility": 93.0,
        "accuracy": 87.0,
        "source_type": "STANDARDIZED_FIELD_TEST",
        "field_test_protocol": "30m Sprint Video Capture",
        "evidence_url": evidence_url
    }, headers=headers)
    assert add_resp.status_code == 201
    rec_id = add_resp.json()["data"]["id"]
    assert add_resp.json()["data"]["data_confidence_score"] >= 85.0

    # Coach verifies record
    coach_token = get_auth_token("jurgen.klopp@sportiq.ai", "Pass123!", "Jurgen Klopp", UserRole.COACH.value)
    coach_headers = {"Authorization": f"Bearer {coach_token}"}
    verify_resp = client.put(f"/api/v1/performance/{rec_id}/verify", json={
        "verification_status": "COACH_VERIFIED",
        "verification_notes": "Reviewed 30m sprint video. Timing and laser markers verified."
    }, headers=coach_headers)
    assert verify_resp.status_code == 200
    assert verify_resp.json()["data"]["verification_status"] == "COACH_VERIFIED"
    assert verify_resp.json()["data"]["data_confidence_score"] >= 94.0
