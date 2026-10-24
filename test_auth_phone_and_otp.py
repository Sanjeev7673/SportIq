import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.enums import UserRole
from app.services.otp_service import OTPService, normalize_indian_phone

client = TestClient(app)


def test_indian_phone_normalization():
    """Test phone normalization helper handles various Indian phone formats."""
    assert normalize_indian_phone("9876543210") == "+919876543210"
    assert normalize_indian_phone("+91 9876543210") == "+919876543210"
    assert normalize_indian_phone("+919876543210") == "+919876543210"
    assert normalize_indian_phone("09876543210") == "+919876543210"
    assert normalize_indian_phone(" 9123456789 ") == "+919123456789"

    # Rejection of invalid phone formats
    with pytest.raises(Exception):
        normalize_indian_phone("12345")
    with pytest.raises(Exception):
        normalize_indian_phone("1876543210") # Does not start with 6, 7, 8, 9
    with pytest.raises(Exception):
        normalize_indian_phone("abcdefghij")


def test_register_with_email_success():
    """Test registering a user with email only."""
    resp = client.post("/api/v1/auth/register", json={
        "name": "Virat Kohli",
        "email": "virat.kohli@sportiq.ai",
        "password": "Password123!",
        "role": UserRole.PLAYER.value
    })
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["user"]["email"] == "virat.kohli@sportiq.ai"
    assert data["user"]["phone_number"] is None
    assert "access_token" in data


def test_register_with_phone_number_success():
    """Test registering a user with Indian phone number only."""
    resp = client.post("/api/v1/auth/register", json={
        "name": "MS Dhoni",
        "phone_number": "9876500001",
        "password": "Password123!",
        "role": UserRole.PLAYER.value
    })
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["user"]["phone_number"] == "+919876500001"
    assert data["user"]["email"] is None
    assert "access_token" in data


def test_duplicate_email_registration_fails():
    """Test duplicate email registration returns 400."""
    client.post("/api/v1/auth/register", json={
        "name": "Sachin Tendulkar",
        "email": "sachin@sportiq.ai",
        "password": "Password123!",
        "role": UserRole.PLAYER.value
    })
    resp = client.post("/api/v1/auth/register", json={
        "name": "Sachin Duplicate",
        "email": "sachin@sportiq.ai",
        "password": "Password123!",
        "role": UserRole.PLAYER.value
    })
    assert resp.status_code == 400
    assert "already registered" in resp.json().get("detail", resp.json().get("message", ""))


def test_duplicate_phone_registration_fails():
    """Test duplicate phone registration returns 400."""
    client.post("/api/v1/auth/register", json={
        "name": "Rahul Dravid",
        "phone_number": "9876500002",
        "password": "Password123!",
        "role": UserRole.PLAYER.value
    })
    resp = client.post("/api/v1/auth/register", json={
        "name": "Rahul Duplicate",
        "phone_number": "+91 9876500002", # Formatted duplicate
        "password": "Password123!",
        "role": UserRole.PLAYER.value
    })
    assert resp.status_code == 400
    assert "already registered" in resp.json().get("detail", resp.json().get("message", ""))


def test_login_with_email_and_phone():
    """Test authenticating using both email and phone number."""
    # 1. Login with email
    client.post("/api/v1/auth/register", json={
        "name": "Hardik Pandya",
        "email": "hardik@sportiq.ai",
        "password": "Password123!",
        "role": UserRole.PLAYER.value
    })
    login_email = client.post("/api/v1/auth/login", json={
        "username": "hardik@sportiq.ai",
        "password": "Password123!"
    })
    assert login_email.status_code == 200
    assert login_email.json()["data"]["user"]["email"] == "hardik@sportiq.ai"

    # 2. Login with phone
    client.post("/api/v1/auth/register", json={
        "name": "Jasprit Bumrah",
        "phone_number": "9876500003",
        "password": "Password123!",
        "role": UserRole.PLAYER.value
    })
    login_phone = client.post("/api/v1/auth/login", json={
        "username": "9876500003",
        "password": "Password123!"
    })
    assert login_phone.status_code == 200
    assert login_phone.json()["data"]["user"]["phone_number"] == "+919876500003"


def test_forgot_password_and_otp_reset_flow_for_email():
    """
    Test complete lifecycle:
    Forgot Password -> OTP Generated -> Verify OTP -> Reset Password with Token -> Login with New Password
    """
    email = "shubman.gill@sportiq.ai"
    client.post("/api/v1/auth/register", json={
        "name": "Shubman Gill",
        "email": email,
        "password": "OldPassword123!",
        "role": UserRole.PLAYER.value
    })

    # Step 1: Request OTP
    forgot_resp = client.post("/api/v1/auth/forgot-password", json={"identifier": email})
    assert forgot_resp.status_code == 200
    assert "verification code" in forgot_resp.json()["data"]["message"].lower()
    assert forgot_resp.json()["data"]["destination_type"] == "EMAIL"

    # For testing, grab the generated OTP hash from DB or test helper
    from tests.conftest import TestingSessionLocal
    from app.models.user import User, OTPVerification
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == email).first()
    otp_record = db.query(OTPVerification).filter(OTPVerification.user_id == user.id, OTPVerification.used_at == None).first()
    assert otp_record is not None

    # Step 2: Try invalid OTP code
    bad_verify = client.post("/api/v1/auth/verify-reset-code", json={
        "identifier": email,
        "code": "000000"
    })
    assert bad_verify.status_code == 400
    assert "Incorrect verification code" in bad_verify.json().get("detail", bad_verify.json().get("message", ""))

    test_code = "847291"
    otp_record.code_hash = OTPService.hash_otp(test_code)
    db.commit()
    db.close()

    # Step 3: Verify correct OTP code
    verify_resp = client.post("/api/v1/auth/verify-reset-code", json={
        "identifier": email,
        "code": test_code
    })
    assert verify_resp.status_code == 200
    reset_token = verify_resp.json()["data"]["reset_token"]
    assert reset_token.startswith("rst_")

    # Step 4: Reset password with reset_token
    reset_resp = client.post("/api/v1/auth/reset-password", json={
        "reset_token": reset_token,
        "new_password": "NewSecretPass123!",
        "confirm_password": "NewSecretPass123!"
    })
    assert reset_resp.status_code == 200
    assert "Password updated successfully" in reset_resp.json()["message"]

    # Step 5: Old password fails
    old_login = client.post("/api/v1/auth/login", json={
        "username": email,
        "password": "OldPassword123!"
    })
    assert old_login.status_code == 401

    # Step 6: New password succeeds
    new_login = client.post("/api/v1/auth/login", json={
        "username": email,
        "password": "NewSecretPass123!"
    })
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()["data"]


def test_forgot_password_and_otp_reset_flow_for_phone():
    """Test Forgot Password & OTP reset flow for Indian phone-number account."""
    phone = "9876500004"
    client.post("/api/v1/auth/register", json={
        "name": "Rishabh Pant",
        "phone_number": phone,
        "password": "OldPassword123!",
        "role": UserRole.PLAYER.value
    })

    # Request OTP
    forgot_resp = client.post("/api/v1/auth/forgot-password", json={"identifier": phone})
    assert forgot_resp.status_code == 200
    assert forgot_resp.json()["data"]["destination_type"] == "PHONE"

    # Set test code in DB
    from tests.conftest import TestingSessionLocal
    from app.models.user import User, OTPVerification
    db = TestingSessionLocal()
    user = db.query(User).filter(User.phone_number == "+919876500004").first()
    otp_record = db.query(OTPVerification).filter(OTPVerification.user_id == user.id, OTPVerification.used_at == None).first()
    test_code = "123456"
    otp_record.code_hash = OTPService.hash_otp(test_code)
    db.commit()
    db.close()

    # Verify OTP
    verify_resp = client.post("/api/v1/auth/verify-reset-code", json={
        "identifier": phone,
        "code": test_code
    })
    assert verify_resp.status_code == 200
    reset_token = verify_resp.json()["data"]["reset_token"]

    # Reset Password
    reset_resp = client.post("/api/v1/auth/reset-password", json={
        "reset_token": reset_token,
        "new_password": "NewPantPassword123!",
        "confirm_password": "NewPantPassword123!"
    })
    assert reset_resp.status_code == 200

    # Login with phone and new password
    login_resp = client.post("/api/v1/auth/login", json={
        "username": phone,
        "password": "NewPantPassword123!"
    })
    assert login_resp.status_code == 200


def test_anti_enumeration_for_nonexistent_account():
    """Test non-existent user identifier returns generic success message to prevent user enumeration."""
    resp = client.post("/api/v1/auth/forgot-password", json={
        "identifier": "nonexistent.user.12345@sportiq.ai"
    })
    assert resp.status_code == 200
    assert "If an account exists" in resp.json()["data"]["message"]
