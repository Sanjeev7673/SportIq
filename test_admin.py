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


def test_admin_dashboard_endpoint():
    admin_token = get_auth_token("super.admin@sportiq.ai", "AdminPass123!", "Super Admin", UserRole.ADMIN.value)
    headers = {"Authorization": f"Bearer {admin_token}"}

    res = client.get("/api/v1/admin/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["total_users"] >= 1
    assert "total_athletes" in data
    assert "total_coaches" in data
    assert "total_scouts" in data
    assert "total_organizers" in data
    assert "total_events" in data
    assert isinstance(data["recent_users"], list)
    assert isinstance(data["recent_event_submissions"], list)


def test_admin_list_users_and_status_toggle():
    admin_token = get_auth_token("super.admin@sportiq.ai", "AdminPass123!", "Super Admin", UserRole.ADMIN.value)
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Register target user
    user_token = get_auth_token("status.toggle.user@sportiq.ai", "Pass123!", "Toggle User", UserRole.PLAYER.value)
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {user_token}"})
    user_id = me_resp.json()["data"]["id"]

    # Toggle status to deactive
    toggle_resp = client.put(f"/api/v1/admin/users/{user_id}/status", json={"is_active": False}, headers=headers)
    assert toggle_resp.status_code == 200
    assert toggle_resp.json()["data"]["is_active"] is False

    # Toggle status back to active
    toggle_resp2 = client.put(f"/api/v1/admin/users/{user_id}/status", json={"is_active": True}, headers=headers)
    assert toggle_resp2.status_code == 200
    assert toggle_resp2.json()["data"]["is_active"] is True


def test_admin_athletes_coaches_scouts_endpoints():
    admin_token = get_auth_token("super.admin@sportiq.ai", "AdminPass123!", "Super Admin", UserRole.ADMIN.value)
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Athletes
    ath_resp = client.get("/api/v1/admin/athletes", headers=headers)
    assert ath_resp.status_code == 200
    assert isinstance(ath_resp.json()["data"], list)

    # Coaches
    coach_resp = client.get("/api/v1/admin/coaches", headers=headers)
    assert coach_resp.status_code == 200
    assert isinstance(coach_resp.json()["data"], list)

    # Scouts
    scout_resp = client.get("/api/v1/admin/scouts", headers=headers)
    assert scout_resp.status_code == 200
    assert isinstance(scout_resp.json()["data"], list)


def test_admin_reports_notifications_settings():
    admin_token = get_auth_token("super.admin@sportiq.ai", "AdminPass123!", "Super Admin", UserRole.ADMIN.value)
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Reports
    rep_resp = client.get("/api/v1/admin/reports", headers=headers)
    assert rep_resp.status_code == 200
    reports = rep_resp.json()["data"]
    assert "users_by_role" in reports
    assert "published_events" in reports

    # Notifications
    notif_resp = client.get("/api/v1/admin/notifications", headers=headers)
    assert notif_resp.status_code == 200
    assert isinstance(notif_resp.json()["data"], list)

    # Settings Get & Update
    settings_resp = client.get("/api/v1/admin/settings", headers=headers)
    assert settings_resp.status_code == 200

    update_settings_resp = client.put("/api/v1/admin/settings", json={
        "platform_name": "SportIQ Enterprise",
        "platform_description": "Next Gen Athletic Intelligence",
        "default_event_visibility": "PUBLIC",
        "event_verification_required": True,
        "organizer_verification_required": True,
        "default_event_expiry_behavior": "AUTO_EXPIRE_PAST_DATE"
    }, headers=headers)
    assert update_settings_resp.status_code == 200
    assert update_settings_resp.json()["data"]["platform_name"] == "SportIQ Enterprise"


def test_admin_update_user_role():
    admin_token = get_auth_token("super.admin@sportiq.ai", "AdminPass123!", "Super Admin", UserRole.ADMIN.value)
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Register user to promote
    promote_token = get_auth_token("promote.me@sportiq.ai", "Pass123!", "Candidate", UserRole.PLAYER.value)
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {promote_token}"})
    user_id = me_resp.json()["data"]["id"]

    # Promote to SCOUT
    update_resp = client.put(f"/api/v1/admin/users/{user_id}", json={
        "role": UserRole.SCOUT.value
    }, headers=headers)
    assert update_resp.status_code == 200
    assert update_resp.json()["data"]["role"] == "SCOUT"


def test_admin_sports_crud():
    admin_token = get_auth_token("super.admin@sportiq.ai", "AdminPass123!", "Super Admin", UserRole.ADMIN.value)
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create sport
    create_resp = client.post("/api/v1/admin/sports", json={
        "name": "Handball",
        "description": "Team sport with fast passing and throwing"
    }, headers=headers)
    assert create_resp.status_code == 201
    sport_data = create_resp.json()["data"]
    sport_id = sport_data["id"]
    assert sport_data["name"] == "Handball"

    # 2. List sports
    list_resp = client.get("/api/v1/admin/sports", headers=headers)
    assert list_resp.status_code == 200
    assert any(s["id"] == sport_id for s in list_resp.json()["data"])

    # 3. Delete sport
    del_resp = client.delete(f"/api/v1/admin/sports/{sport_id}", headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["data"]["deleted"] is True


def test_admin_endpoints_forbidden_for_player():
    player_token = get_auth_token("regular.user@sportiq.ai", "Pass123!", "Regular User", UserRole.PLAYER.value)
    headers = {"Authorization": f"Bearer {player_token}"}

    response = client.get("/api/v1/admin/dashboard", headers=headers)
    assert response.status_code == 403

    response2 = client.get("/api/v1/admin/reports", headers=headers)
    assert response2.status_code == 403
