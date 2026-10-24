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


def test_create_player_profile_success():
    token = get_auth_token("marcus.rashford@sportiq.ai", "Pass123!", "Marcus Rashford", UserRole.PLAYER.value)
    headers = {"Authorization": f"Bearer {token}"}

    profile_payload = {
        "sport": "Football",
        "position": "Forward / Winger",
        "age": 21,
        "gender": "Male",
        "experience": 5,
        "height": 180.0,
        "weight": 70.5,
        "achievements": "Regional Championship Top Scorer 2025",
        "profile_image": "https://example.com/rashford.jpg"
    }

    response = client.post("/api/v1/players/profile", json=profile_payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["sport"] == "Football"
    assert data["data"]["position"] == "Forward / Winger"
    assert data["data"]["height"] == 180.0


def test_upload_profile_photo():
    token = get_auth_token("marcus.rashford@sportiq.ai", "Pass123!", "Marcus Rashford", UserRole.PLAYER.value)
    headers = {"Authorization": f"Bearer {token}"}

    # Create dummy PNG file
    file_bytes = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82")
    files = {"file": ("avatar.png", file_bytes, "image/png")}

    response = client.post("/api/v1/players/profile/photo", files=files, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["profile_image"].startswith("/uploads/profile_photos/")


def test_create_player_profile_duplicate_fails():
    token = get_auth_token("marcus.rashford@sportiq.ai", "Pass123!", "Marcus Rashford", UserRole.PLAYER.value)
    headers = {"Authorization": f"Bearer {token}"}

    profile_payload = {
        "sport": "Football",
        "position": "Striker"
    }

    response = client.post("/api/v1/players/profile", json=profile_payload, headers=headers)
    assert response.status_code == 400
    assert response.json()["success"] is False


def test_create_profile_by_coach_forbidden():
    token = get_auth_token("pep.guardiola@sportiq.ai", "Pass123!", "Pep Guardiola", UserRole.COACH.value)
    headers = {"Authorization": f"Bearer {token}"}

    profile_payload = {
        "sport": "Football",
        "position": "Midfielder"
    }

    response = client.post("/api/v1/players/profile", json=profile_payload, headers=headers)
    assert response.status_code == 403


def test_get_my_profile():
    token = get_auth_token("marcus.rashford@sportiq.ai", "Pass123!", "Marcus Rashford", UserRole.PLAYER.value)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/players/profile/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["sport"] == "Football"
    assert data["data"]["age"] == 21


def test_update_my_profile():
    token = get_auth_token("marcus.rashford@sportiq.ai", "Pass123!", "Marcus Rashford", UserRole.PLAYER.value)
    headers = {"Authorization": f"Bearer {token}"}

    update_payload = {
        "weight": 72.0,
        "achievements": "National Youth League MVP 2026"
    }

    response = client.put("/api/v1/players/profile/me", json=update_payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["weight"] == 72.0
    assert "MVP 2026" in data["data"]["achievements"]


def test_search_and_filter_players():
    token2 = get_auth_token("serena.williams@sportiq.ai", "Pass123!", "Serena Williams", UserRole.PLAYER.value)
    headers2 = {"Authorization": f"Bearer {token2}"}
    client.post("/api/v1/players/profile", json={
        "sport": "Tennis",
        "position": "Singles",
        "age": 22,
        "gender": "Female",
        "experience": 8,
        "height": 175.0,
        "weight": 68.0
    }, headers=headers2)

    scout_token = get_auth_token("monchi.scout@sportiq.ai", "Pass123!", "Monchi Scout", UserRole.SCOUT.value)
    scout_headers = {"Authorization": f"Bearer {scout_token}"}

    res_football = client.get("/api/v1/players?sport=Football", headers=scout_headers)
    assert res_football.status_code == 200
    football_data = res_football.json()["data"]
    assert any(p["sport"] == "Football" for p in football_data["players"])

    res_tennis = client.get("/api/v1/players?sport=Tennis", headers=scout_headers)
    assert res_tennis.status_code == 200
    tennis_data = res_tennis.json()["data"]
    assert any(p["sport"] == "Tennis" for p in tennis_data["players"])

    res_search = client.get("/api/v1/players?search=Rashford", headers=scout_headers)
    assert res_search.status_code == 200
    search_data = res_search.json()["data"]
    assert search_data["total"] >= 1


def test_get_player_by_id():
    token = get_auth_token("marcus.rashford@sportiq.ai", "Pass123!", "Marcus Rashford", UserRole.PLAYER.value)
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/api/v1/players/profile/me", headers=headers)
    player_id = me_resp.json()["data"]["id"]

    response = client.get(f"/api/v1/players/{player_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["id"] == player_id
    assert data["data"]["sport"] == "Football"
    assert data["data"]["user"]["email"] == "marcus.rashford@sportiq.ai"


def test_delete_my_profile():
    del_token = get_auth_token("temp.player@sportiq.ai", "Pass123!", "Temp Player", UserRole.PLAYER.value)
    del_headers = {"Authorization": f"Bearer {del_token}"}

    client.post("/api/v1/players/profile", json={
        "sport": "Badminton",
        "position": "Singles",
        "age": 19
    }, headers=del_headers)

    del_res = client.delete("/api/v1/players/profile/me", headers=del_headers)
    assert del_res.status_code == 200
    assert del_res.json()["data"]["deleted"] is True

    get_res = client.get("/api/v1/players/profile/me", headers=del_headers)
    assert get_res.status_code == 404
