import requests

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Login as coach
login_res = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "coach_alex@sportiq.ai",
    "password": "Password123!"
})
if login_res.status_code != 200:
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "vasudhareni21@gmail.com",
        "password": "Password123!"
    })

token = login_res.json()["data"]["access_token"]
headers = {"Authorization": f"Bearer {token}"}

email = "sivabharanisivaguna@gmail.com"

tests = [
    ("No Filters", {}),
    ("Email Only", {"search": email}),
    ("Sport Only (Badminton)", {"sport": "Badminton"}),
    ("Gender Only (Female)", {"gender": "Female"}),
    ("Email + Sport", {"search": email, "sport": "Badminton"}),
    ("Email + Gender", {"search": email, "gender": "Female"}),
    ("Email + Sport + Gender", {"search": email, "sport": "Badminton", "gender": "Female"}),
]

print("=" * 70)
print(f" TESTING PLAYER DISCOVERY HTTP API WITH ATHLETE: {email}")
print("=" * 70)

for name, params in tests:
    res = requests.get(f"{BASE_URL}/coaches/players", params=params, headers=headers)
    assert res.status_code == 200, f"Failed for {name}: {res.text}"
    data = res.json()["data"]
    total = data["total"]
    players = data["players"]
    matched = [p for p in players if p["email"] == email or (p.get("user") and p["user"]["email"] == email)]
    print(f"[{name:<24}] -> Total Found: {total} | Matched Target Athlete: {len(matched) > 0}")
    if matched:
        p = matched[0]
        print(f"    Details: ID={p['id']}, Name={p['name']}, Sport={p['sport']}, Gender={p['gender']}, Status={p['performance_status']}, AI Score={p['latest_talent_score']}")

print("=" * 70)
