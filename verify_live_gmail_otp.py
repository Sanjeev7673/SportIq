import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

print("=" * 80)
print(" LIVE GMAIL SMTP FORGOT PASSWORD TEST")
print("=" * 80)

user_email = "sivabharanisivaguna@gmail.com"

# Ensure user exists
reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
    "name": "Siva Bharani",
    "email": user_email,
    "password": "InitialPassword123!",
    "role": "PLAYER"
})
if reg_resp.status_code == 201:
    print(f"[PASS] Registered account for {user_email}")
else:
    print(f"[INFO] Account {user_email} already exists, proceeding to forgot-password.")

# Request Live Email OTP
print(f"\nSending live OTP to {user_email} via Gmail SMTP...")
forgot_resp = requests.post(f"{BASE_URL}/auth/forgot-password", json={
    "identifier": user_email
})

print(f"HTTP Status: {forgot_resp.status_code}")
print(f"Response:\n{json.dumps(forgot_resp.json(), indent=2)}")

assert forgot_resp.status_code == 200
data = forgot_resp.json()["data"]

print("\n" + "=" * 80)
print(f"[SUCCESS] Real OTP email dispatched to {user_email}!")
print(f"Masked Destination in UI: {data['masked_destination']}")
print(f"Delivery Status: {data['delivery_status']}")
print(f"Is Dev Mode: {data['is_dev_mode']}")
print("=" * 80)
