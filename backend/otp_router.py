"""Reusable FastAPI router for SportIQ email/SMS OTP verification.

Mount this router in the existing FastAPI application and prefix it with /api/v1.
Twilio Verify stores and validates OTPs; this service never generates or logs codes.
"""
from __future__ import annotations

import os
import re
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client

router = APIRouter(prefix="/otp", tags=["OTP"])
Purpose = Literal["registration", "forgot_password"]
Channel = Literal["email", "sms"]


def _client() -> Client:
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
    api_key = os.getenv("TWILIO_API_KEY", "").strip()
    api_secret = os.getenv("TWILIO_API_SECRET", "").strip()
    if not all((account_sid, api_key, api_secret)):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OTP delivery is not configured on the server.",
        )
    return Client(api_key, api_secret, account_sid=account_sid)


def _service_sid() -> str:
    value = os.getenv("TWILIO_VERIFY_SERVICE_SID", "").strip()
    if not re.fullmatch(r"VA[0-9a-fA-F]{32}", value):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OTP verification service is not configured on the server.",
        )
    return value


class SendOTPRequest(BaseModel):
    purpose: Purpose
    channel: Channel
    destination: str = Field(min_length=3, max_length=254)


class VerifyOTPRequest(BaseModel):
    purpose: Purpose
    channel: Channel
    destination: str = Field(min_length=3, max_length=254)
    code: str = Field(min_length=4, max_length=10, pattern=r"^[0-9A-Za-z-]+$")


def _normalize_destination(channel: Channel, destination: str) -> str:
    value = destination.strip()
    if channel == "email":
        # Basic validation; use a dedicated email validator at the UI boundary too.
        if len(value) > 254 or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise HTTPException(status_code=422, detail="Enter a valid email address.")
        return value.lower()
    # Twilio requires phone numbers in E.164 format (e.g. +14155552671).
    if not re.fullmatch(r"\+[1-9]\d{7,14}", value):
        raise HTTPException(
            status_code=422,
            detail="Enter a phone number in international E.164 format, including + and country code.",
        )
    return value


@router.post("/send")
def send_otp(payload: SendOTPRequest):
    """Send an OTP to an email address or E.164 phone number."""
    destination = _normalize_destination(payload.channel, payload.destination)
    client = _client()
    try:
        verification = (
            client.verify.v2.services(_service_sid()).verifications.create(
                to=destination,
                channel=payload.channel,
            )
        )
    except TwilioRestException as exc:
        # Do not return provider internals or credentials to clients.
        raise HTTPException(
            status_code=502,
            detail="The verification provider could not send the code. Check the destination and server configuration.",
        ) from exc
    if verification.status not in ("pending", "approved"):
        raise HTTPException(status_code=502, detail="The provider did not accept the verification request.")
    return {
        "success": True,
        "purpose": payload.purpose,
        "channel": payload.channel,
        "status": verification.status,
        "message": f"If the destination is eligible, a verification code has been requested by {payload.channel}.",
    }


@router.post("/verify")
def verify_otp(payload: VerifyOTPRequest):
    """Validate a code. The caller must only complete the requested auth action if approved."""
    destination = _normalize_destination(payload.channel, payload.destination)
    client = _client()
    try:
        check = (
            client.verify.v2.services(_service_sid()).verification_checks.create(
                to=destination,
                code=payload.code,
            )
        )
    except TwilioRestException as exc:
        if exc.status in (400, 404):
            return {"success": False, "verified": False, "message": "The code is invalid or expired. Request a new code."}
        raise HTTPException(
            status_code=502,
            detail="The verification provider could not validate the code. Please try again.",
        ) from exc
    approved = check.status == "approved"
    response = {
        "success": approved,
        "verified": approved,
        "purpose": payload.purpose,
        "channel": payload.channel,
        "message": "Code verified." if approved else "The code is invalid or expired. Request a new code.",
    }
    if not approved:
        return response

    # Resolve account state only after the provider confirms the code. Imports are local
    # to avoid a module-import cycle with the FastAPI application.
    from app.main import SessionLocal, User, PasswordResetGrant
    db = SessionLocal()
    try:
        lookup_value = destination.lower() if payload.channel == "email" else destination
        lookup_column = User.email if payload.channel == "email" else User.phone
        user = db.query(User).filter(lookup_column == lookup_value).first()
        if payload.purpose == "registration":
            if user:
                if payload.channel == "email":
                    user.email_verified = True
                else:
                    user.phone_verified = True
                db.commit()
                response["message"] = f"{payload.channel.capitalize()} verified."
            else:
                response["message"] = "Code verified, but no account is registered with that destination."
        elif payload.purpose == "forgot_password":
            if user:
                raw_token = secrets.token_urlsafe(32)
                token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
                now = datetime.now(timezone.utc)
                grant = PasswordResetGrant(
                    user_id=user.id,
                    token_hash=token_hash,
                    expires_at=now + timedelta(minutes=10),
                )
                db.add(grant)
                db.commit()
                response["reset_token"] = raw_token
                response["message"] = "Code verified. Use the reset token to set a new password within 10 minutes."
            else:
                response["message"] = "Code verified. If an account matches this destination, reset instructions will be available."
        return response
    finally:
        db.close()
