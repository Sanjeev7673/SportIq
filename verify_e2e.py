import requests
import json
import time
import sys

BASE_URL = "http://127.0.0.1:8000"
API_V1 = f"{BASE_URL}/api/v1"

passed = 0
failed = 0
results = []

def test(name, fn):
    global passed, failed
    try:
        fn()
        passed += 1
        results.append((name, "PASSED", None))
        print(f" [PASS] {name}")
    except Exception as e:
        failed += 1
        results.append((name, "FAILED", str(e)))
        print(f" [FAIL] {name}: {str(e)}")

print("=" * 70)
print(" SPORTIQ END-TO-END SYSTEM INTEGRATION VERIFICATION")
print(f" Target Server: {API_V1}")
print("=" * 70)

# Shared State
tokens = {}
player_id = None
perf_record_id = None
coach_rec_id = None
shortlist_id = None
sport_id = None
ts = int(time.time())

# 1. Health Check
def test_health():
    res = requests.get(f"{API_V1}/health")
    assert res.status_code == 200, f"Status {res.status_code}: {res.text}"
    body = res.json()
    assert body["success"] is True
    assert body["data"]["status"] == "ok"
    assert body["data"]["database"] == "connected"

    # Root endpoint
    root_res = requests.get(f"{BASE_URL}/")
    assert root_res.status_code == 200
    assert root_res.json()["success"] is True
test("1. Server & Database Health Check", test_health)

# 2. CORS Verification
def test_cors():
    res = requests.options(
        f"{API_V1}/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert res.status_code in [200, 204], f"Status: {res.status_code}"
    assert res.headers.get("access-control-allow-origin") in ["http://localhost:3000", "*"]
test("2. CORS Configuration (Allows React Frontend http://localhost:3000)", test_cors)

# 3. User Registration
def test_user_registration():
    users_to_register = [
        {"name": "E2E Athlete", "email": f"athlete_{ts}@sportiq.ai", "password": "Password123!", "role": "PLAYER"},
        {"name": "E2E Coach", "email": f"coach_{ts}@sportiq.ai", "password": "Password123!", "role": "COACH"},
        {"name": "E2E Scout", "email": f"scout_{ts}@sportiq.ai", "password": "Password123!", "role": "SCOUT"},
        {"name": "E2E Admin", "email": f"admin_{ts}@sportiq.ai", "password": "Password123!", "role": "ADMIN"},
    ]
    for u in users_to_register:
        res = requests.post(f"{API_V1}/auth/register", json=u)
        assert res.status_code == 201, f"Registration failed for {u['role']}: {res.text}"
        data = res.json()["data"]
        assert "access_token" in data
        tokens[u["role"]] = data["access_token"]
test("3. User Registration (PLAYER, COACH, SCOUT, ADMIN)", test_user_registration)

# 4. User Login
def test_user_login():
    res = requests.post(f"{API_V1}/auth/login", json={
        "email": f"athlete_{ts}@sportiq.ai",
        "password": "Password123!"
    })
    assert res.status_code == 200, f"Login failed: {res.text}"
    assert "access_token" in res.json()["data"]
test("4. User Login & Token Issuance", test_user_login)

# 5. Current User / Authentication Me
def test_current_user():
    for role, tok in tokens.items():
        res = requests.get(f"{API_V1}/auth/me", headers={"Authorization": f"Bearer {tok}"})
        assert res.status_code == 200, f"Failed /auth/me for {role}: {res.text}"
        assert res.json()["data"]["role"] == role
test("5. JWT Authentication & /auth/me Endpoint", test_current_user)

# 6. Player Profile
def test_player_profile():
    global player_id
    headers = {"Authorization": f"Bearer {tokens['PLAYER']}"}
    # Create profile
    res = requests.post(f"{API_V1}/players/profile", json={
        "sport": "Football",
        "position": "Forward",
        "age": 19,
        "gender": "Male",
        "experience": 4,
        "height": 182,
        "weight": 76,
        "achievements": "National Youth Golden Boot 2025"
    }, headers=headers)
    assert res.status_code == 201, f"Profile create failed: {res.text}"
    profile = res.json()["data"]
    player_id = profile["id"]
    assert profile["sport"] == "Football"
    assert profile["position"] == "Forward"

    # Get Own Profile
    get_res = requests.get(f"{API_V1}/players/profile/me", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["id"] == player_id

    # Update Profile
    update_res = requests.put(f"{API_V1}/players/profile/me", json={
        "experience": 5
    }, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["data"]["experience"] == 5
test("6. Player Athletic Profile Lifecycle (Create, Read, Update)", test_player_profile)

# 7. Player Performance Logging
def test_player_performance():
    global perf_record_id
    headers = {"Authorization": f"Bearer {tokens['PLAYER']}"}
    # Log session
    res = requests.post(f"{API_V1}/performance", json={
        "speed": 92.0,
        "stamina": 88.0,
        "strength": 80.0,
        "agility": 94.0,
        "accuracy": 86.0,
        "matches_played": 10
    }, headers=headers)
    assert res.status_code == 201, f"Performance log failed: {res.text}"
    perf = res.json()["data"]
    perf_record_id = perf["id"]
    assert perf["speed"] == 92.0

    # Get Player Stats Summary
    stats_res = requests.get(f"{API_V1}/performance/player/{player_id}/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()["data"]
    assert stats["avg_speed"] >= 90.0
    assert stats["total_matches_played"] == 10
test("7. Performance Metrics Logging & Stats Aggregation", test_player_performance)

# 8. Coach Functionality
def test_coach_features():
    global coach_rec_id
    headers = {"Authorization": f"Bearer {tokens['COACH']}"}
    # List squad
    squad_res = requests.get(f"{API_V1}/coaches/players", headers=headers)
    assert squad_res.status_code == 200
    assert squad_res.json()["data"]["total"] >= 1

    # Create Recommendation
    rec_res = requests.post(f"{API_V1}/coaches/recommendations", json={
        "player_id": player_id,
        "title": "Explosive Acceleration Routine",
        "description": "Perform resisted sled sprints and plyometric box jumps.",
        "focus_areas": "Speed, Agility",
        "status": "ACTIVE"
    }, headers=headers)
    assert rec_res.status_code == 201, f"Recommendation failed: {rec_res.text}"
    rec_data = rec_res.json()["data"]
    coach_rec_id = rec_data["id"]

    # Update Recommendation status
    up_res = requests.put(f"{API_V1}/coaches/recommendations/{coach_rec_id}", json={
        "status": "COMPLETED"
    }, headers=headers)
    assert up_res.status_code == 200
    assert up_res.json()["data"]["status"] == "COMPLETED"
test("8. Coach Operations (Squad Discovery & Training Recommendations)", test_coach_features)

# 9. Scout Functionality
def test_scout_features():
    global shortlist_id
    headers = {"Authorization": f"Bearer {tokens['SCOUT']}"}
    # Search prospects
    search_res = requests.get(f"{API_V1}/scouts/search?sport=Football", headers=headers)
    assert search_res.status_code == 200
    assert search_res.json()["data"]["total"] >= 1

    # Add to Shortlist
    short_res = requests.post(f"{API_V1}/scouts/shortlist", json={
        "player_id": player_id,
        "notes": "Top tier agility and acceleration. Recommended for academy trial."
    }, headers=headers)
    assert short_res.status_code == 201, f"Shortlist failed: {short_res.text}"
    shortlist_id = short_res.json()["data"]["id"]

    # View Shortlist
    view_res = requests.get(f"{API_V1}/scouts/shortlist", headers=headers)
    assert view_res.status_code == 200
    assert any(item["player_id"] == player_id for item in view_res.json()["data"])
test("9. Scout Operations (Talent Search & Shortlist Bookmarking)", test_scout_features)

# 10. Admin Functionality
def test_admin_features():
    global sport_id
    headers = {"Authorization": f"Bearer {tokens['ADMIN']}"}
    # List users
    users_res = requests.get(f"{API_V1}/admin/users", headers=headers)
    assert users_res.status_code == 200
    assert users_res.json()["data"]["total"] >= 4

    # Create Sport
    sport_res = requests.post(f"{API_V1}/admin/sports", json={
        "name": f"Handball_{ts}",
        "description": "Team sport with fast-paced throws and physical agility"
    }, headers=headers)
    assert sport_res.status_code == 201
    sport_id = sport_res.json()["data"]["id"]

    # Get Platform KPIs
    stats_res = requests.get(f"{API_V1}/admin/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()["data"]
    assert stats["total_users"] >= 4
    assert stats["total_players"] >= 1
test("10. Admin Governance (Users, Sports Taxonomy & Platform KPIs)", test_admin_features)

# 11. AI Prediction Engine
def test_ai_prediction():
    headers = {"Authorization": f"Bearer {tokens['PLAYER']}"}
    res = requests.post(f"{API_V1}/ai/predict", json={
        "speed": 92.0,
        "stamina": 88.0,
        "strength": 80.0,
        "agility": 94.0,
        "accuracy": 86.0,
        "age": 19,
        "sport": "Football",
        "position": "Forward",
        "player_id": player_id,
        "performance_id": perf_record_id
    }, headers=headers)
    assert res.status_code == 200, f"AI Predict failed: {res.text}"
    ai_data = res.json()["data"]
    assert ai_data["performance_score"] >= 80.0
    assert ai_data["talent_score"] >= 80.0
    assert ai_data["potential_level"] == "HIGH"
    assert "Speed" in ai_data["strengths"]
    assert len(ai_data["recommendations"]) > 10
    assert ai_data["confidence_score"] >= 0.80
test("11. AI/ML Prediction Engine (Multi-Factor Scoring & Potential Classification)", test_ai_prediction)

# 12. AI History & Latest Retrieval
def test_ai_history():
    headers = {"Authorization": f"Bearer {tokens['PLAYER']}"}
    # Latest
    latest_res = requests.get(f"{API_V1}/ai/players/{player_id}/latest", headers=headers)
    assert latest_res.status_code == 200
    latest = latest_res.json()["data"]
    assert latest["potential_level"] == "HIGH"

    # History
    hist_res = requests.get(f"{API_V1}/ai/players/{player_id}/history", headers=headers)
    assert hist_res.status_code == 200
    assert len(hist_res.json()["data"]) >= 1
test("12. AI Analysis History Timeline Retrieval", test_ai_history)

print("=" * 70)
print(f" TOTAL END-TO-END TESTS: {passed + failed} | PASSED: {passed} | FAILED: {failed}")
print("=" * 70)

if failed > 0:
    sys.exit(1)
