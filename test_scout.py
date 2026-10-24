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


def create_player(email: str, name: str, sport: str, position: str) -> int:
    """Helper to create a player profile and return player ID."""
    token = get_auth_token(email, "Pass123!", name, UserRole.PLAYER.value)
    headers = {"Authorization": f"Bearer {token}"}
    prof_resp = client.post("/api/v1/players/profile", json={
        "sport": sport,
        "position": position,
        "age": 19,
        "height": 185.0,
        "weight": 78.0
    }, headers=headers)
    if prof_resp.status_code == 201:
        return prof_resp.json()["data"]["id"]
    me_resp = client.get("/api/v1/players/profile/me", headers=headers)
    return me_resp.json()["data"]["id"]


def test_scout_search_talent():
    scout_token = get_auth_token("ralf.rangnick@sportiq.ai", "Pass123!", "Ralf Rangnick", UserRole.SCOUT.value)
    headers = {"Authorization": f"Bearer {scout_token}"}

    create_player("lamine.yamal@sportiq.ai", "Lamine Yamal", "Football", "Right Winger")

    response = client.get("/api/v1/scouts/search?sport=Football", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["total"] >= 1
    assert any(p["name"] == "Lamine Yamal" for p in data["data"]["players"])


def test_scout_view_player_performance():
    scout_token = get_auth_token("ralf.rangnick@sportiq.ai", "Pass123!", "Ralf Rangnick", UserRole.SCOUT.value)
    headers = {"Authorization": f"Bearer {scout_token}"}
    player_id = create_player("pedri.gonzalez@sportiq.ai", "Pedri Gonzalez", "Football", "Midfielder")

    admin_token = get_auth_token("admin.scout@sportiq.ai", "Pass123!", "Admin", UserRole.ADMIN.value)
    client.post("/api/v1/performance", json={
        "player_id": player_id,
        "speed": 82.0, "stamina": 93.0, "strength": 74.0, "agility": 90.0, "accuracy": 94.0
    }, headers={"Authorization": f"Bearer {admin_token}"})

    response = client.get(f"/api/v1/scouts/players/{player_id}/performance", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["summary"]["max_accuracy"] == 94.0


def test_scout_compare_prospects():
    scout_token = get_auth_token("ralf.rangnick@sportiq.ai", "Pass123!", "Ralf Rangnick", UserRole.SCOUT.value)
    headers = {"Authorization": f"Bearer {scout_token}"}

    p1_id = create_player("scout.p1@sportiq.ai", "Scout Target 1", "Basketball", "Forward")
    p2_id = create_player("scout.p2@sportiq.ai", "Scout Target 2", "Basketball", "Guard")

    payload = {"player_ids": [p1_id, p2_id]}
    response = client.post("/api/v1/scouts/compare", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["data"]["count"] == 2


def test_shortlist_lifecycle():
    scout_token = get_auth_token("ralf.rangnick@sportiq.ai", "Pass123!", "Ralf Rangnick", UserRole.SCOUT.value)
    headers = {"Authorization": f"Bearer {scout_token}"}
    player_id = create_player("florian.wirtz@sportiq.ai", "Florian Wirtz", "Football", "Attacking Midfielder")

    # 1. Add to shortlist
    add_payload = {
        "player_id": player_id,
        "notes": "Exceptional spatial vision and creative passing. Priority recruitment target."
    }
    add_resp = client.post("/api/v1/scouts/shortlist", json=add_payload, headers=headers)
    assert add_resp.status_code == 201
    shortlist_item = add_resp.json()["data"]
    item_id = shortlist_item["id"]
    assert shortlist_item["player_name"] == "Florian Wirtz"
    assert "Exceptional spatial vision" in shortlist_item["notes"]

    # 2. Duplicate bookmark fails
    dup_resp = client.post("/api/v1/scouts/shortlist", json=add_payload, headers=headers)
    assert dup_resp.status_code == 400

    # 3. View my shortlist
    list_resp = client.get("/api/v1/scouts/shortlist", headers=headers)
    assert list_resp.status_code == 200
    assert any(s["id"] == item_id for s in list_resp.json()["data"])

    # 4. Update notes
    update_resp = client.put(f"/api/v1/scouts/shortlist/{item_id}", json={
        "notes": "Updated: In advanced negotiations for summer transfer window."
    }, headers=headers)
    assert update_resp.status_code == 200
    assert "summer transfer window" in update_resp.json()["data"]["notes"]

    # 5. Remove from shortlist
    del_resp = client.delete(f"/api/v1/scouts/shortlist/{item_id}", headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["data"]["deleted"] is True


def test_scout_search_forbidden_for_player():
    player_token = get_auth_token("regular.athlete@sportiq.ai", "Pass123!", "Regular Athlete", UserRole.PLAYER.value)
    headers = {"Authorization": f"Bearer {player_token}"}

    response = client.get("/api/v1/scouts/search", headers=headers)
    assert response.status_code == 403
