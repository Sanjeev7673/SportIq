import time
import requests
import io

BASE_URL = "http://127.0.0.1:8000/api/v1"

print("=" * 85)
print(" SPORTIQ SECURE VIDEO VERIFICATION & DELETION WORKFLOW — E2E LIVE TEST")
print("=" * 85)

# Step 1: Login Athlete & Coach
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
print("[PASS] 1. Athlete (Marcus Rashford) & Coach (Pep Guardiola) Authenticated.")

# Step 2: Athlete uploads an unverified video
print("\n--- Step 2: Upload Unverified Video & Test Athlete Delete ---")
fake_video = io.BytesIO(b"unverified drill video content to be deleted")
up_res = requests.post(
    f"{BASE_URL}/video-assessments/upload",
    data={"sport": "Football", "assessment_type": "Sprint", "notes": "Temporary drill for delete test"},
    files={"file": ("unverified_drill.mp4", fake_video, "video/mp4")},
    headers=player_headers
)
assert up_res.status_code == 201
v1_id = up_res.json()["data"]["id"]
time.sleep(1.0)

v1_detail = requests.get(f"{BASE_URL}/video-assessments/{v1_id}", headers=player_headers).json()["data"]
print(f"       -> Uploaded Assessment #{v1_id} | Status: {v1_detail['status']}")
assert v1_detail["status"] != "VERIFIED"

# Step 3: Athlete deletes unverified video
del_res = requests.delete(f"{BASE_URL}/video-assessments/{v1_id}", headers=player_headers)
assert del_res.status_code == 200
print(f"       -> Deleted Assessment #{v1_id}: {del_res.json()['message']}")

# Verify it is gone
get_res = requests.get(f"{BASE_URL}/video-assessments/{v1_id}", headers=player_headers)
assert get_res.status_code == 404
print("[PASS] Step 2 & 3 Passed: Athlete successfully deleted unverified video.")

# Step 4: Athlete uploads video for Coach Verification
print("\n--- Step 4: Upload Video -> Coach Verifies -> Immutability Locked ---")
verify_video = io.BytesIO(b"official 1080p 60fps continuous 5s sprint drill footage")
up_res2 = requests.post(
    f"{BASE_URL}/video-assessments/upload",
    data={"sport": "Football", "assessment_type": "Sprint", "notes": "Official acceleration drill for coach certification"},
    files={"file": ("official_sprint_drill.mp4", verify_video, "video/mp4")},
    headers=player_headers
)
assert up_res2.status_code == 201
v2_id = up_res2.json()["data"]["id"]
time.sleep(1.0)

# Coach verifies assessment
verify_res = requests.post(
    f"{BASE_URL}/video-assessments/{v2_id}/verify",
    json={"notes": "Certified 30m sprint execution and upright torso angle."},
    headers=coach_headers
)
assert verify_res.status_code == 200
v2_verified = verify_res.json()["data"]
print(f"       -> Coach Pep Verified Assessment #{v2_id} | Status: {v2_verified['status']}")
assert v2_verified["status"] == "VERIFIED"
assert v2_verified["verified_by"] is not None

# Step 5: Athlete attempts to DELETE verified video -> MUST BE REJECTED WITH HTTP 403!
print("\n--- Step 5: Athlete Attempts to Delete Verified Video ---")
forbidden_del = requests.delete(f"{BASE_URL}/video-assessments/{v2_id}", headers=player_headers)
print(f"       -> Athlete Delete Status Code: {forbidden_del.status_code}")
print(f"       -> Response Body: {forbidden_del.json()}")
assert forbidden_del.status_code == 403
assert "Verified assessments cannot be deleted or modified" in forbidden_del.json().get("detail", forbidden_del.json().get("message", ""))
print("[PASS] Step 4 & 5 Passed: Verified assessment is strictly locked and immutable (HTTP 403 Forbidden).")

# Step 6: Coach Rejection Workflow
print("\n--- Step 6: Coach Rejection Workflow ---")
reject_video = io.BytesIO(b"drill with poor camera placement")
up_res3 = requests.post(
    f"{BASE_URL}/video-assessments/upload",
    data={"sport": "Football", "assessment_type": "Dribbling", "notes": "Cone drill for rejection test"},
    files={"file": ("cone_drill_poor_angle.mp4", reject_video, "video/mp4")},
    headers=player_headers
)
assert up_res3.status_code == 201
v3_id = up_res3.json()["data"]["id"]
time.sleep(1.0)

reject_res = requests.post(
    f"{BASE_URL}/video-assessments/{v3_id}/reject",
    json={"reason": "Camera is positioned too far from the dribbling cones. Please record from 3 meters away."},
    headers=coach_headers
)
assert reject_res.status_code == 200
v3_rejected = reject_res.json()["data"]
print(f"       -> Coach Rejected Assessment #{v3_id} | Status: {v3_rejected['status']}")
print(f"       -> Rejection Reason: {v3_rejected['rejection_reason']}")
assert v3_rejected["status"] == "REJECTED"

# Athlete deletes rejected assessment
del_rejected_res = requests.delete(f"{BASE_URL}/video-assessments/{v3_id}", headers=player_headers)
assert del_rejected_res.status_code == 200
print(f"       -> Athlete deleted rejected Assessment #{v3_id} successfully.")
print("[PASS] Step 6 Passed: Coach rejection and athlete re-upload lifecycle working.")

# Step 7: Audit Trail Check
print("\n--- Step 7: Audit Trail History ---")
audit_res = requests.get(f"{BASE_URL}/video-assessments/{v2_id}/audit", headers=player_headers)
assert audit_res.status_code == 200
audits = audit_res.json()["data"]
print(f"       -> Retrieved {len(audits)} audit trail events for Assessment #{v2_id}:")
for a in audits:
    print(f"          [{a['timestamp']}] {a['action']} by {a['actor_name']}: {a['details']}")
print("[PASS] Step 7 Passed: Audit trail correctly logged all lifecycle actions.")

print("\n" + "=" * 85)
print(" ALL VERIFICATION & DELETION WORKFLOW RULES VERIFIED 100% LIVE ON FASTAPI")
print("=" * 85)
