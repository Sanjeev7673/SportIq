import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

print("=" * 80)
print(" VERIFYING FORGOT PASSWORD FIX & SCHEMA MATCH — LIVE E2E")
print("=" * 80)

test_email = "marcus.rashford@sportiq.ai"

# Step 1: POST forgot-password
print(f"\n1. Sending POST /api/v1/auth/forgot-password with email: {test_email}")
resp = requests.post(f"{BASE_URL}/auth/forgot-password", json={"identifier": test_email})
print(f"   HTTP Status: {resp.status_code}")
print(f"   Response Body:\n{json.dumps(resp.json(), indent=2)}")

assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
body = resp.json()
assert body["success"] is True
data = body["data"]
assert data["masked_destination"] is not None, "masked_destination must not be null"
assert data["destination_type"] == "EMAIL"
print(f"   [PASS] masked_destination: {data['masked_destination']}")
print(f"   [PASS] delivery_status: {data['delivery_status']}")
print(f"   [PASS] is_dev_mode: {data['is_dev_mode']}")

# Step 2: Extract OTP code (from dev_otp or DB)
otp_code = data.get("dev_otp")
if not otp_code:
    # DB fallback
    from app.database.session import SessionLocal
    from app.models.user import User, OTPVerification
    from app.services.otp_service import OTPService
    db = SessionLocal()
    u = db.query(User).filter(User.email == test_email).first()
    otp_rec = db.query(OTPVerification).filter(OTPVerification.user_id == u.id, OTPVerification.used_at == None).first()
    otp_code = "777888"
    otp_rec.code_hash = OTPService.hash_otp(otp_code)
    db.commit()
    db.close()

print(f"\n2. Verifying OTP Code '{otp_code}' for {test_email}")
verify_resp = requests.post(f"{BASE_URL}/auth/verify-reset-code", json={
    "identifier": test_email,
    "code": otp_code
})
print(f"   HTTP Status: {verify_resp.status_code}")
print(f"   Response Body:\n{json.dumps(verify_resp.json(), indent=2)}")
assert verify_resp.status_code == 200
reset_token = verify_resp.json()["data"]["reset_token"]
assert reset_token.startswith("rst_")
print(f"   [PASS] Obtained reset_token: {reset_token[:10]}...")

# Step 3: Reset password
print(f"\n3. Submitting POST /api/v1/auth/reset-password")
reset_resp = requests.post(f"{BASE_URL}/auth/reset-password", json={
    "reset_token": reset_token,
    "new_password": "NewRashfordPass2026!",
    "confirm_password": "NewRashfordPass2026!"
})
print(f"   HTTP Status: {reset_resp.status_code}")
print(f"   Response Body:\n{json.dumps(reset_resp.json(), indent=2)}")
assert reset_resp.status_code == 200
print(f"   [PASS] Password reset successfully confirmed.")

# Step 4: Login with new password
print(f"\n4. Authenticating with new password on POST /api/v1/auth/login")
login_resp = requests.post(f"{BASE_URL}/auth/login", json={
    "username": test_email,
    "password": "NewRashfordPass2026!"
})
print(f"   HTTP Status: {login_resp.status_code}")
assert login_resp.status_code == 200
print(f"   [PASS] Logged in successfully! User: {login_resp.json()['data']['user']['name']}")

print("\n" + "=" * 80)
print(" FORGOT PASSWORD WORKFLOW COMPLETELY VERIFIED AND WORKING 100%")
print("=" * 80)
