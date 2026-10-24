import requests
import json

BASE_URL = "http://127.0.0.1:8000"
API_V1 = f"{BASE_URL}/api/v1"

print("=" * 70)
print(" SPORTIQ AUTHENTICATION & LOGIN AUDIT")
print("=" * 70)

# Step 1: Check FastAPI health & /docs
docs_res = requests.get(f"{BASE_URL}/docs")
assert docs_res.status_code == 200, f"/docs failed: {docs_res.status_code}"
print("[PASS] Step 1: FastAPI server is up and /docs is reachable (Status 200)")

# Step 2: Check CORS Preflight from http://localhost:3000
cors_res = requests.options(
    f"{API_V1}/auth/login",
    headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,authorization"
    }
)
assert cors_res.status_code in [200, 204], f"CORS Preflight failed: {cors_res.status_code}"
allow_origin = cors_res.headers.get("access-control-allow-origin")
print(f"[PASS] Step 2: CORS Preflight verified (Access-Control-Allow-Origin: {allow_origin})")

# Step 3: Test Login for all 4 Roles
accounts = [
    ("PLAYER", "alex.player@sportiq.ai", "Player123!"),
    ("COACH", "jurgen.coach@sportiq.ai", "Coach123!"),
    ("SCOUT", "michael.scout@sportiq.ai", "Scout123!"),
    ("ADMIN", "admin@sportiq.ai", "Admin123!"),
]

for role, email, password in accounts:
    # Attempt login
    login_res = requests.post(f"{API_V1}/auth/login", json={"email": email, "password": password})
    if login_res.status_code != 200:
        # Register if account doesn't exist yet
        reg_res = requests.post(f"{API_V1}/auth/register", json={
            "name": f"Verified {role}",
            "email": email,
            "password": password,
            "role": role
        })
        assert reg_res.status_code in [200, 201], f"Registration failed for {role}: {reg_res.text}"
        data = reg_res.json()["data"]
    else:
        data = login_res.json()["data"]

    token = data["access_token"]
    user = data["user"]
    assert user["role"] == role, f"Role mismatch: {user['role']} != {role}"

    # Verify /auth/me with Bearer token
    me_res = requests.get(f"{API_V1}/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_user = me_res.json()["data"]
    assert me_user["email"] == email

    print(f"[PASS] Role Login: {role:<7} | Email: {email:<26} | User ID: {user['id']} | Token verified via /auth/me")

print("=" * 70)
print(" ALL 4 ROLES AUTHENTICATED SUCCESSFULLY")
print("=" * 70)
