import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from fastapi import status
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


def test_public_list_events_and_seeding():
    res = client.get("/api/v1/events")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["success"] is True
    assert data["data"]["total"] >= 6
    assert len(data["data"]["events"]) >= 6

    # Verify Badminton event exists
    badminton_event = next((e for e in data["data"]["events"] if e["sport"] == "Badminton"), None)
    assert badminton_event is not None
    assert "Coimbatore" in badminton_event["title"] or "Coimbatore" in badminton_event["city"]
    assert badminton_event["status"] == "PUBLISHED"
    assert badminton_event["verification_status"] == "VERIFIED"


def test_event_filtering_by_sport_and_city():
    # Filter by sport Badminton
    res = client.get("/api/v1/events?sport=Badminton")
    assert res.status_code == status.HTTP_200_OK
    events = res.json()["data"]["events"]
    assert len(events) > 0
    assert all(e["sport"].lower() == "badminton" for e in events)

    # Filter by city Coimbatore
    res_city = client.get("/api/v1/events?city=Coimbatore")
    assert res_city.status_code == status.HTTP_200_OK
    c_events = res_city.json()["data"]["events"]
    assert len(c_events) > 0
    assert all(e["city"].lower() == "coimbatore" for e in c_events)


def test_event_keyword_search():
    res = client.get("/api/v1/events?search=Tennis")
    assert res.status_code == status.HTTP_200_OK
    events = res.json()["data"]["events"]
    assert len(events) > 0
    assert any("Tennis" in e["title"] or "Tennis" in e["sport"] for e in events)


def test_get_event_details_and_view_count():
    res = client.get("/api/v1/events")
    first_event = res.json()["data"]["events"][0]
    initial_views = first_event["views_count"]

    res_detail = client.get(f"/api/v1/events/{first_event['id']}")
    assert res_detail.status_code == status.HTTP_200_OK
    detail = res_detail.json()["data"]
    assert detail["id"] == first_event["id"]
    assert detail["title"] == first_event["title"]
    assert detail["views_count"] == initial_views + 1
    assert "registration_url" in detail


def test_save_and_unsave_event_bookmark():
    token = get_auth_token("athlete_bookmark@sportiq.ai", "Pass123!", "Bookmark Athlete", UserRole.PLAYER.value)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/events")
    event_id = res.json()["data"]["events"][0]["id"]

    # Save event
    save_res = client.post(f"/api/v1/events/{event_id}/save", headers=headers)
    assert save_res.status_code == status.HTTP_200_OK
    assert save_res.json()["data"]["saved"] is True

    # Check saved list
    saved_list_res = client.get("/api/v1/events/saved", headers=headers)
    assert saved_list_res.status_code == status.HTTP_200_OK
    saved_items = saved_list_res.json()["data"]
    assert any(s["event_id"] == event_id for s in saved_items)

    # Check event details reflects is_saved = True
    detail_res = client.get(f"/api/v1/events/{event_id}", headers=headers)
    assert detail_res.json()["data"]["is_saved"] is True

    # Unsave event
    unsave_res = client.delete(f"/api/v1/events/{event_id}/save", headers=headers)
    assert unsave_res.status_code == status.HTTP_200_OK
    assert unsave_res.json()["data"]["saved"] is False


def test_coach_recommend_event_to_athlete():
    player_token = get_auth_token("athlete_rec_test@sportiq.ai", "Pass123!", "Rec Athlete", UserRole.PLAYER.value)
    player_headers = {"Authorization": f"Bearer {player_token}"}

    coach_token = get_auth_token("coach_rec_test@sportiq.ai", "Pass123!", "Rec Coach", UserRole.COACH.value)
    coach_headers = {"Authorization": f"Bearer {coach_token}"}

    # Ensure player profile exists
    p_res = client.post(
        "/api/v1/players/profile",
        json={
            "sport": "Badminton",
            "position": "Singles",
            "age": 19,
            "experience": 4
        },
        headers=player_headers
    )
    player_id = p_res.json()["data"]["id"]

    # Get an event
    events_res = client.get("/api/v1/events?sport=Badminton")
    event_id = events_res.json()["data"]["events"][0]["id"]

    # Coach recommends event
    rec_res = client.post(
        f"/api/v1/events/{event_id}/recommend",
        json={
            "player_id": player_id,
            "message": "Key ranking tournament to test match stamina."
        },
        headers=coach_headers
    )
    assert rec_res.status_code == status.HTTP_201_CREATED
    rec_data = rec_res.json()["data"]
    assert rec_data["player_id"] == player_id
    assert rec_data["event_id"] == event_id

    # Athlete views recommended events
    athlete_rec_res = client.get("/api/v1/events/recommended", headers=player_headers)
    assert athlete_rec_res.status_code == status.HTTP_200_OK
    athlete_recs = athlete_rec_res.json()["data"]
    assert len(athlete_recs) > 0
    assert any(r["event_id"] == event_id for r in athlete_recs)


def test_organizer_create_event_workflow_and_admin_verification():
    org_token = get_auth_token("tn_organizer_flow@sportiq.ai", "Pass123!", "Organizer Flow", UserRole.ORGANIZER.value)
    org_headers = {"Authorization": f"Bearer {org_token}"}

    admin_token = get_auth_token("admin_events_flow@sportiq.ai", "Pass123!", "Admin Flow", UserRole.ADMIN.value)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    today = date.today()
    start = today + timedelta(days=20)
    end = today + timedelta(days=23)
    deadline = today + timedelta(days=15)

    # 1. Organizer submits event
    create_res = client.post(
        "/api/v1/organizer/events",
        json={
            "title": "Salem Open State Table Tennis Tournament 2026",
            "sport": "Table Tennis",
            "event_type": "Tournament",
            "description": "State level table tennis ranking tournament with junior and senior draws.",
            "start_date": str(start),
            "end_date": str(end),
            "registration_deadline": str(deadline),
            "start_time": "09:00 AM",
            "end_time": "07:00 PM",
            "venue": "Salem Indoor Stadium",
            "city": "Salem",
            "state": "Tamil Nadu",
            "country": "India",
            "age_min": 12,
            "age_max": 25,
            "gender": "All",
            "competition_level": "State",
            "entry_fee": "₹400 / Entry",
            "prize_details": "₹30,000 Cash Prize & Medals",
            "eligibility": "Registered state players with valid TT card.",
            "organizer_name": "Salem District Table Tennis Club",
            "contact_email": "salem_tt@sportiq.ai",
            "contact_phone": "+91 98421 99000",
            "registration_url": "https://tntta.org/salem-open-2026",
            "source_url": "https://tntta.org/circulars/salem-2026.pdf"
        },
        headers=org_headers
    )
    assert create_res.status_code == status.HTTP_201_CREATED
    event = create_res.json()["data"]
    event_id = event["id"]
    assert event["status"] == "PENDING_REVIEW"
    assert event["verification_status"] == "PENDING"

    # 2. Verify NOT visible in public list yet
    public_res = client.get("/api/v1/events?sport=Table%20Tennis")
    tt_events = public_res.json()["data"]["events"]
    assert not any(e["id"] == event_id for e in tt_events)

    # 3. Admin views pending queue
    pending_res = client.get("/api/v1/admin/events/pending", headers=admin_headers)
    assert pending_res.status_code == status.HTTP_200_OK
    pending_events = pending_res.json()["data"]
    assert any(e["id"] == event_id for e in pending_events)

    # 4. Admin approves event
    approve_res = client.put(f"/api/v1/admin/events/{event_id}/approve", headers=admin_headers)
    assert approve_res.status_code == status.HTTP_200_OK
    approved_event = approve_res.json()["data"]
    assert approved_event["status"] == "PUBLISHED"
    assert approved_event["verification_status"] == "VERIFIED"

    # 5. Now visible in public list
    public_res2 = client.get("/api/v1/events?sport=Table%20Tennis")
    tt_events2 = public_res2.json()["data"]["events"]
    assert any(e["id"] == event_id for e in tt_events2)


def test_admin_direct_create_and_stats():
    admin_token = get_auth_token("admin_direct_stats@sportiq.ai", "Pass123!", "Admin Stats User", UserRole.ADMIN.value)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    today = date.today()
    start = today + timedelta(days=30)
    end = today + timedelta(days=35)
    deadline = today + timedelta(days=25)

    create_res = client.post(
        "/api/v1/admin/events",
        json={
            "title": "National Youth Swimming Championship 2026",
            "sport": "Swimming",
            "event_type": "Championship",
            "description": "National Aquatic Federation Championship.",
            "start_date": str(start),
            "end_date": str(end),
            "registration_deadline": str(deadline),
            "venue": "Dr. SPM Swimming Pool Complex",
            "city": "New Delhi",
            "state": "Delhi",
            "country": "India",
            "age_min": 14,
            "age_max": 18,
            "gender": "All",
            "competition_level": "National",
            "entry_fee": "₹500",
            "prize_details": "National Gold, Silver, Bronze & Merit Certificates",
            "eligibility": "State trial qualifiers only.",
            "organizer_name": "Swimming Federation of India",
            "contact_email": "national@swimmingfed.in",
            "contact_phone": "+91 11 2333 4444",
            "registration_url": "https://swimmingfed.in/youth-championship-2026"
        },
        headers=admin_headers
    )
    assert create_res.status_code == status.HTTP_201_CREATED
    assert create_res.json()["data"]["status"] == "PUBLISHED"
    assert create_res.json()["data"]["verification_status"] == "VERIFIED"

    # Verify admin event stats
    stats_res = client.get("/api/v1/admin/events/stats", headers=admin_headers)
    assert stats_res.status_code == status.HTTP_200_OK
    stats = stats_res.json()["data"]
    assert stats["total_events"] >= 7
    assert stats["published_events"] >= 7


def test_security_forbidden_roles_on_event_endpoints():
    player_token = get_auth_token("player_forbidden_test@sportiq.ai", "Pass123!", "Player User", UserRole.PLAYER.value)
    player_headers = {"Authorization": f"Bearer {player_token}"}

    # Player trying to access admin endpoints -> 403 Forbidden
    res = client.get("/api/v1/admin/events/pending", headers=player_headers)
    assert res.status_code == status.HTTP_403_FORBIDDEN

    res2 = client.post("/api/v1/admin/events", json={}, headers=player_headers)
    assert res2.status_code == status.HTTP_403_FORBIDDEN
