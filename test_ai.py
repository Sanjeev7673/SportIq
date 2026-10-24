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


def test_ai_predict_high_talent():
    token = get_auth_token("ai.test.user@sportiq.ai", "Pass123!", "AI Test User", UserRole.COACH.value)
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "speed": 95.0,
        "stamina": 88.0,
        "strength": 82.0,
        "agility": 94.0,
        "accuracy": 86.0,
        "age": 18,
        "sport": "Football",
        "position": "Winger"
    }

    response = client.post("/api/v1/ai/predict", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    res = data["data"]
    assert res["performance_score"] >= 85.0
    assert res["talent_score"] >= 85.0
    assert res["potential_level"] == "HIGH"
    assert "Speed" in res["strengths"]
    assert res["confidence_score"] >= 0.80
    assert res["model_version"] == "v1.0"


def test_ai_predict_developing_talent():
    token = get_auth_token("ai.test.user@sportiq.ai", "Pass123!", "AI Test User", UserRole.COACH.value)
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "speed": 52.0,
        "stamina": 55.0,
        "strength": 48.0,
        "agility": 50.0,
        "accuracy": 54.0,
        "age": 26,
        "sport": "Basketball",
        "position": "Guard"
    }

    response = client.post("/api/v1/ai/predict", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    res = data["data"]
    assert res["talent_score"] < 60.0
    assert res["potential_level"] == "DEVELOPING"
    assert len(res["recommendations"]) > 10


def test_ai_predict_and_persist_to_database():
    # 1. Create Player & Performance Record
    p_token = get_auth_token("ai.athlete.persist@sportiq.ai", "Pass123!", "AI Athlete", UserRole.PLAYER.value)
    headers = {"Authorization": f"Bearer {p_token}"}
    prof_resp = client.post("/api/v1/players/profile", json={
        "sport": "Football",
        "position": "Forward",
        "age": 19
    }, headers=headers)
    player_id = prof_resp.json()["data"]["id"]

    perf_resp = client.post("/api/v1/performance", json={
        "speed": 92.0,
        "stamina": 86.0,
        "strength": 78.0,
        "agility": 90.0,
        "accuracy": 88.0
    }, headers=headers)
    perf_id = perf_resp.json()["data"]["id"]

    # 2. Predict and persist
    predict_payload = {
        "speed": 92.0,
        "stamina": 86.0,
        "strength": 78.0,
        "agility": 90.0,
        "accuracy": 88.0,
        "age": 19,
        "sport": "Football",
        "position": "Forward",
        "player_id": player_id,
        "performance_id": perf_id
    }
    predict_resp = client.post("/api/v1/ai/predict", json=predict_payload, headers=headers)
    assert predict_resp.status_code == 200
    res = predict_resp.json()["data"]
    assert res["id"] is not None
    assert res["player_id"] == player_id
    assert res["performance_id"] == perf_id

    # 3. Retrieve latest AI evaluation for player
    latest_resp = client.get(f"/api/v1/ai/players/{player_id}/latest", headers=headers)
    assert latest_resp.status_code == 200
    assert latest_resp.json()["data"]["id"] == res["id"]

    # 4. Retrieve AI history for player
    hist_resp = client.get(f"/api/v1/ai/players/{player_id}/history", headers=headers)
    assert hist_resp.status_code == 200
    assert len(hist_resp.json()["data"]) >= 1


def test_ai_predict_unauthorized():
    payload = {
        "speed": 80.0, "stamina": 80.0, "strength": 80.0, "agility": 80.0, "accuracy": 80.0
    }
    response = client.post("/api/v1/ai/predict", json=payload)
    assert response.status_code == 401
