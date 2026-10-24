import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.enums import UserRole

client = TestClient(app)


def test_register_player():
    payload = {
        "name": "Alex Morgan",
        "email": "alex.player@sportiq.ai",
        "password": "SecurePassword123!",
        "role": UserRole.PLAYER.value
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == "alex.player@sportiq.ai"
    assert data["data"]["user"]["role"] == "PLAYER"


def test_register_coach():
    payload = {
        "name": "Jurgen Klopp",
        "email": "jurgen.coach@sportiq.ai",
        "password": "SecurePassword123!",
        "role": UserRole.COACH.value
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["user"]["role"] == "COACH"


def test_register_scout():
    payload = {
        "name": "Michael Edwards",
        "email": "michael.scout@sportiq.ai",
        "password": "SecurePassword123!",
        "role": UserRole.SCOUT.value
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["user"]["role"] == "SCOUT"


def test_register_admin():
    payload = {
        "name": "Chief Administrator",
        "email": "chief.administrator@sportiq.ai",
        "password": "AdminPassword123!",
        "role": UserRole.ADMIN.value
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["user"]["role"] == "ADMIN"


def test_register_duplicate_email():
    payload = {
        "name": "Duplicate User",
        "email": "alex.player@sportiq.ai",
        "password": "AnotherPassword123!",
        "role": UserRole.PLAYER.value
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "already registered" in data["message"]


def test_login_success():
    payload = {
        "email": "alex.player@sportiq.ai",
        "password": "SecurePassword123!"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == "alex.player@sportiq.ai"


def test_login_invalid_password():
    payload = {
        "email": "alex.player@sportiq.ai",
        "password": "WrongPassword123!"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False


def test_login_nonexistent_user():
    payload = {
        "email": "nonexistent@sportiq.ai",
        "password": "RandomPassword123!"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False


def test_get_me_authorized():
    # Login first
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "alex.player@sportiq.ai",
        "password": "SecurePassword123!"
    })
    token = login_resp.json()["data"]["access_token"]

    # Call /me with Bearer token
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "alex.player@sportiq.ai"
    assert data["data"]["role"] == "PLAYER"


def test_get_me_unauthorized():
    # Call /me without token
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

    # Call /me with malformed token
    headers = {"Authorization": "Bearer invalid_token_xyz"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401
