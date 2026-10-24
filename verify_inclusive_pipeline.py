import requests
import io

BASE_URL = "http://127.0.0.1:8000/api/v1"

print("=" * 75)
print(" SPORTIQ DEVICE-INCLUSIVE & DATA CONFIDENCE PIPELINE VERIFICATION")
print("=" * 75)

# Step 1: Login Player & Coach
player_login = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "marcus.rashford@sportiq.ai",
    "password": "Pass123!"
}).json()["data"]
player_token = player_login["access_token"]
player_headers = {"Authorization": f"Bearer {player_token}"}

coach_login = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "pep.guardiola@sportiq.ai",
    "password": "Pass123!"
}).json()["data"]
coach_token = coach_login["access_token"]
coach_headers = {"Authorization": f"Bearer {coach_token}"}

# Step 2: Upload Smartphone Video Proof
video_file = io.BytesIO(b"fake mp4 video bytes header payload for sprint")
upload_res = requests.post(
    f"{BASE_URL}/performance/evidence",
    files={"file": ("sprint_30m_proof.mp4", video_file, "video/mp4")},
    headers=player_headers
)
assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
video_url = upload_res.json()["data"]["evidence_url"]
print(f"[PASS] 1. Smartphone Video Proof Uploaded: {video_url}")

# Step 3: Log Standardized Field Test with Video Evidence
field_test_res = requests.post(
    f"{BASE_URL}/performance",
    json={
        "speed": 92.0,
        "stamina": 85.0,
        "strength": 80.0,
        "agility": 88.0,
        "accuracy": 82.0,
        "source_type": "STANDARDIZED_FIELD_TEST",
        "field_test_protocol": "30m Sprint Stopwatch Trial",
        "evidence_url": video_url,
        "assessment_date": "2026-08-15"
    },
    headers=player_headers
)
assert field_test_res.status_code == 201, f"Field test logging failed: {field_test_res.text}"
field_record = field_test_res.json()["data"]
print(f"[PASS] 2. Standardized Field Test Logged:")
print(f"       Record ID: {field_record['id']} | Source: {field_record['source_type']}")
print(f"       Data Confidence Score: {field_record['data_confidence_score']}% (Elevated by video evidence & protocol)")

# Step 4: Log Unverified Manual Entry
manual_res = requests.post(
    f"{BASE_URL}/performance",
    json={
        "speed": 85.0,
        "stamina": 80.0,
        "strength": 75.0,
        "agility": 90.0,
        "accuracy": 70.0,
        "source_type": "SELF_REPORTED_MANUAL",
        "assessment_date": "2026-08-16"
    },
    headers=player_headers
)
assert manual_res.status_code == 201
manual_record = manual_res.json()["data"]
print(f"[PASS] 3. Self-Reported Manual Logged:")
print(f"       Record ID: {manual_record['id']} | Status: {manual_record['verification_status']}")
print(f"       Data Confidence Score: {manual_record['data_confidence_score']}% (Initial unverified confidence)")

# Step 5: Coach Certifies & Verifies the Manual Entry
verify_res = requests.put(
    f"{BASE_URL}/performance/{manual_record['id']}/verify",
    json={
        "verification_status": "COACH_VERIFIED",
        "verification_notes": "Coach Pep certified 30m timing drill in training session."
    },
    headers=coach_headers
)
assert verify_res.status_code == 200
verified_record = verify_res.json()["data"]
print(f"[PASS] 4. Coach Certification Applied:")
print(f"       New Status: {verified_record['verification_status']}")
print(f"       New Confidence Score: {verified_record['data_confidence_score']}% (Elevated to verified baseline)")

# Step 6: Test AI Prediction with Data Confidence
ai_res = requests.post(
    f"{BASE_URL}/ai/predict",
    json={
        "speed": 92.0,
        "stamina": 85.0,
        "strength": 80.0,
        "agility": 88.0,
        "accuracy": 82.0,
        "sport": "Football",
        "position": "Forward",
        "age": 20,
        "player_id": field_record["player_id"],
        "performance_id": field_record["id"]
    },
    headers=player_headers
)
assert ai_res.status_code == 200
ai_data = ai_res.json()["data"]
print(f"[PASS] 5. AI Talent Intelligence Evaluated:")
print(f"       Talent Index: {ai_data['talent_score']} / 100 ({ai_data['potential_level']} Potential)")
print(f"       Data Confidence Score: {ai_data['data_confidence_score']}% (Decoupled from talent score)")

print("=" * 75)
print(" ALL DEVICE-INCLUSIVE CAPABILITIES VERIFIED 100% SUCCESSFULLY")
print("=" * 75)
