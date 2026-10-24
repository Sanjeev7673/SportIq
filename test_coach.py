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
        "age": 22,
        "height": 182.0,
        "weight": 75.0
    }, headers=headers)
    if prof_resp.status_code == 201:
        return prof_resp.json()["data"]["id"]
    me_resp = client.get("/api/v1/players/profile/me", headers=headers)
    return me_resp.json()["data"]["id"]


def test_coach_list_players():
    coach_token = get_auth_token("mikel.arteta@sportiq.ai", "Pass123!", "Mikel Arteta", UserRole.COACH.value)
    headers = {"Authorization": f"Bearer {coach_token}"}

    create_player("declan.rice@sportiq.ai", "Declan Rice", "Football", "Midfielder")

    response = client.get("/api/v1/coaches/players?sport=Football", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["total"] >= 1


def test_coach_view_player_performance():
    coach_token = get_auth_token("mikel.arteta@sportiq.ai", "Pass123!", "Mikel Arteta", UserRole.COACH.value)
    headers = {"Authorization": f"Bearer {coach_token}"}
    player_id = create_player("gabriel.martinelli@sportiq.ai", "Gabriel Martinelli", "Football", "Winger")

    # Add a performance record for this player
    client.post("/api/v1/performance", json={
        "player_id": player_id,
        "speed": 94.0, "stamina": 86.0, "strength": 76.0, "agility": 92.0, "accuracy": 85.0
    }, headers=headers)

    response = client.get(f"/api/v1/coaches/players/{player_id}/performance", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]["records"]) >= 1
    assert data["data"]["summary"]["max_speed"] == 94.0


def test_compare_players():
    coach_token = get_auth_token("mikel.arteta@sportiq.ai", "Pass123!", "Mikel Arteta", UserRole.COACH.value)
    headers = {"Authorization": f"Bearer {coach_token}"}

    p1_id = create_player("player1.compare@sportiq.ai", "Compare Player 1", "Basketball", "Guard")
    p2_id = create_player("player2.compare@sportiq.ai", "Compare Player 2", "Basketball", "Center")

    # Log metrics
    client.post("/api/v1/performance", json={
        "player_id": p1_id, "speed": 88.0, "stamina": 85.0, "strength": 75.0, "agility": 90.0, "accuracy": 82.0
    }, headers=headers)

    client.post("/api/v1/performance", json={
        "player_id": p2_id, "speed": 75.0, "stamina": 80.0, "strength": 95.0, "agility": 70.0, "accuracy": 88.0
    }, headers=headers)

    # Compare
    payload = {"player_ids": [p1_id, p2_id]}
    response = client.post("/api/v1/coaches/compare", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["count"] == 2
    comp = data["data"]["comparison"]
    assert comp[0]["avg_speed"] == 88.0
    assert comp[1]["avg_strength"] == 95.0


def test_compare_players_invalid_count():
    coach_token = get_auth_token("mikel.arteta@sportiq.ai", "Pass123!", "Mikel Arteta", UserRole.COACH.value)
    headers = {"Authorization": f"Bearer {coach_token}"}

    response = client.post("/api/v1/coaches/compare", json={"player_ids": [1]}, headers=headers)
    assert response.status_code == 422 or response.status_code == 400


def test_create_and_manage_training_recommendation():
    coach_token = get_auth_token("mikel.arteta@sportiq.ai", "Pass123!", "Mikel Arteta", UserRole.COACH.value)
    headers = {"Authorization": f"Bearer {coach_token}"}
    player_id = create_player("william.saliba@sportiq.ai", "William Saliba", "Football", "Defender")

    # Create recommendation
    create_payload = {
        "player_id": player_id,
        "title": "High-Intensity Recovery & Agility Drill",
        "description": "Perform 4x400m intervals followed by cone agility drills.",
        "focus_areas": "Agility, Stamina",
        "status": "ACTIVE"
    }
    create_resp = client.post("/api/v1/coaches/recommendations", json=create_payload, headers=headers)
    assert create_resp.status_code == 201
    rec_data = create_resp.json()["data"]
    rec_id = rec_data["id"]
    assert rec_data["title"] == "High-Intensity Recovery & Agility Drill"
    assert rec_data["coach_name"] == "Mikel Arteta"

    # List coach's recommendations
    my_recs_resp = client.get("/api/v1/coaches/recommendations", headers=headers)
    assert my_recs_resp.status_code == 200
    assert any(r["id"] == rec_id for r in my_recs_resp.json()["data"])

    # List recommendations for target player
    player_recs_resp = client.get(f"/api/v1/coaches/recommendations/player/{player_id}", headers=headers)
    assert player_recs_resp.status_code == 200
    assert any(r["id"] == rec_id for r in player_recs_resp.json()["data"])

    # Update recommendation status
    update_resp = client.put(f"/api/v1/coaches/recommendations/{rec_id}", json={
        "status": "COMPLETED"
    }, headers=headers)
    assert update_resp.status_code == 200
    assert update_resp.json()["data"]["status"] == "COMPLETED"

    # Delete recommendation
    del_resp = client.delete(f"/api/v1/coaches/recommendations/{rec_id}", headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["data"]["deleted"] is True
