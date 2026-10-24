from typing import Optional, List
from pydantic import BaseModel, EmailStr, model_validator
from app.models.enums import UserRole
from app.schemas.user import UserResponse


class RegisterRequest(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    password: str
    role: UserRole = UserRole.PLAYER

    @model_validator(mode="after")
    def check_email_or_phone(self):
        if not self.email and not self.phone_number:
            raise ValueError("Please provide either an email address or a phone number for registration.")
        return self


class LoginRequest(BaseModel):
    username: Optional[str] = None # Accepts Email or Phone Number
    email: Optional[str] = None    # Backward-compatible email field
    password: str

    @model_validator(mode="after")
    def check_identifier(self):
        if not self.username and not self.email:
            raise ValueError("Please enter your email or phone number to sign in.")
        return self


class TokenData(BaseModel):
    user_id: int
    role: UserRole
    email: Optional[str] = None
    phone_number: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    identifier: str # Email or Phone number
    preferred_destination: Optional[str] = None # "EMAIL" or "PHONE" if user has both


class ForgotPasswordResponse(BaseModel):
    message: str
    destination_type: Optional[str] = None
    masked_destination: Optional[str] = None
    available_destinations: Optional[List[str]] = None
    delivery_status: str = "SENT" # "SENT" or "DEVELOPMENT_MODE" or "NOT_CONFIGURED"
    is_dev_mode: bool = False
    dev_note: Optional[str] = None
    dev_otp: Optional[str] = None


class VerifyResetCodeRequest(BaseModel):
    identifier: str
    code: str


class VerifyResetCodeResponse(BaseModel):
    message: str
    reset_token: str


class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str
    confirm_password: str

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("New password and confirm password do not match.")
        if len(self.new_password) < 6:
            raise ValueError("Password must be at least 6 characters in length.")
        return self
