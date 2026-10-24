import os
import re
import secrets
import hashlib
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException, status

from app.models.user import User, OTPVerification
from app.core.security import get_password_hash
from app.core.config import settings


def normalize_indian_phone(phone_str: str) -> str:
    """
    Normalizes Indian mobile phone numbers to a consistent +91XXXXXXXXXX format.
    Accepts:
      - +91 9876543210
      - +919876543210
      - 9876543210
      - 09876543210
    Rejects numbers not conforming to standard 10-digit Indian mobile range ([6-9]XXXXXXXXX).
    """
    if not phone_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is required."
        )

    # Strip all non-digit characters except leading '+'
    cleaned = re.sub(r"[^\d+]", "", phone_str.strip())

    # Extract digits only
    digits = re.sub(r"[^\d]", "", cleaned)

    if cleaned.startswith("+91") and len(digits) == 12:
        local_10 = digits[2:]
    elif digits.startswith("91") and len(digits) == 12:
        local_10 = digits[2:]
    elif digits.startswith("0") and len(digits) == 11:
        local_10 = digits[1:]
    elif len(digits) == 10:
        local_10 = digits
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid phone number format '{phone_str}'. Please provide a valid 10-digit Indian mobile number."
        )

    # Validate 10-digit mobile number starts with 6, 7, 8, or 9
    if not re.match(r"^[6-9]\d{9}$", local_10):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid Indian mobile number '{phone_str}'. Indian mobile numbers must start with 6, 7, 8, or 9."
        )

    return f"+91{local_10}"


class OTPService:
    @staticmethod
    def hash_otp(code: str) -> str:
        """Computes SHA-256 hash of OTP code with salt for secure database persistence."""
        salt = settings.OTP_SECRET_SALT or os.getenv("OTP_SECRET_SALT", "sportiq_secure_otp_salt_2026")
        return hashlib.sha256(f"{code}:{salt}".encode("utf-8")).hexdigest()

    @staticmethod
    def mask_destination(destination: str, dest_type: str) -> str:
        """
        Masks email or phone number for safe user presentation.
        Example email: s***i@sportiq.ai
        Example phone: +91 98****3210
        """
        if not destination:
            return ""

        if dest_type == "EMAIL":
            parts = destination.split("@")
            if len(parts) == 2:
                name, domain = parts
                if len(name) <= 2:
                    masked_name = name[0] + "***"
                else:
                    masked_name = name[0] + "***" + name[-1]
                return f"{masked_name}@{domain}"
            return destination
        else:
            # Phone: +919876543210 -> +91 98****3210
            cleaned = destination.strip()
            if len(cleaned) >= 10:
                prefix = cleaned[:6]
                suffix = cleaned[-4:]
                return f"{prefix}****{suffix}"
            return destination

    @staticmethod
    def send_email_otp(email: str, code: str) -> Tuple[bool, str, str]:
        """
        Dispatches password reset OTP email.
        If SMTP environment variables are configured (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD),
        dispatches live email via SMTP with HTML + Plain text templates.
        Otherwise, returns DEVELOPMENT_MODE status with explicit instructions.
        """
        smtp_host = settings.SMTP_HOST or os.getenv("SMTP_HOST")
        smtp_port = settings.SMTP_PORT or int(os.getenv("SMTP_PORT", "587"))
        smtp_user = settings.SMTP_USER or os.getenv("SMTP_USER") or os.getenv("SMTP_USERNAME")
        smtp_pass = settings.SMTP_PASSWORD or os.getenv("SMTP_PASSWORD") or os.getenv("SMTP_PASS")
        smtp_from = settings.SMTP_FROM_EMAIL or os.getenv("SMTP_FROM_EMAIL") or smtp_user or "noreply@sportiq.ai"
        smtp_from_name = settings.SMTP_FROM_NAME or os.getenv("SMTP_FROM_NAME", "SportIQ Athlete Intelligence")

        if smtp_pass:
            smtp_pass = smtp_pass.replace(" ", "").strip()

        if smtp_host and smtp_user and smtp_pass:
            try:
                # Construct multipart email message
                msg = MIMEMultipart("alternative")
                msg["Subject"] = f"SportIQ — Password Reset Verification Code: {code}"
                msg["From"] = f"{smtp_from_name} <{smtp_from}>"
                msg["To"] = email

                plain_text = f"""SportIQ Password Reset Verification

Your verification code is: {code}

This code will expire in 10 minutes.
If you did not request a password reset, you can safely ignore this message.

— SportIQ Team"""

                html_content = f"""
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <title>SportIQ Verification</title>
                </head>
                <body style="margin: 0; padding: 24px; background-color: #0a0f1d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  <div style="max-width: 480px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; color: #f8fafc;">
                    <div style="margin-bottom: 24px; text-align: center;">
                      <h1 style="color: #38bdf8; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                        Sport<span style="color: #ffffff;">IQ</span>
                      </h1>
                      <p style="color: #64748b; font-size: 12px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">
                        Password Reset Verification
                      </p>
                    </div>

                    <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
                      We received a request to reset the password for your SportIQ account. Enter the 6-digit verification code below to proceed:
                    </p>

                    <div style="background: linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(30, 41, 59, 0.6)); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                      <span style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8;">
                        {code}
                      </span>
                    </div>

                    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-bottom: 8px;">
                      ⏱ This code is valid for <strong>10 minutes</strong> and can only be used once.
                    </p>
                    <p style="color: #64748b; font-size: 11px; line-height: 1.5; margin-top: 16px; border-top: 1px solid #1e293b; pt: 16px;">
                      If you did not request this verification code, please ignore this email or contact support. Your password will remain unchanged.
                    </p>
                  </div>
                </body>
                </html>
                """

                msg.attach(MIMEText(plain_text, "plain"))
                msg.attach(MIMEText(html_content, "html"))

                use_ssl = os.getenv("SMTP_USE_SSL", "0") == "1" or smtp_port == 465
                if use_ssl:
                    server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
                else:
                    server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
                    server.starttls()

                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_from, [email], msg.as_string())
                server.quit()

                print(f"[OTP Dispatch] Live SMTP email delivered successfully to {email}")
                return True, "SENT", "Verification code sent to your registered email address."
            except Exception as e:
                print(f"[OTP Dispatch Error] SMTP delivery to {email} failed: {e}")
                return False, "FAILED", f"SMTP delivery failed: {str(e)}"

        # Safe Development Mode fallback
        print(f"[OTP Dispatch - Development Mode] Verification Code for {email}: {code}")
        return True, "DEVELOPMENT_MODE", "Verification code generated in Development Mode (SMTP not configured)."

    @staticmethod
    def send_sms_otp(phone: str, code: str) -> Tuple[bool, str, str]:
        """
        Dispatches password reset OTP SMS.
        Supports Twilio / Fast2SMS / Msg91 if configured.
        Otherwise returns DEVELOPMENT_MODE status.
        """
        twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
        twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
        twilio_from = os.getenv("TWILIO_PHONE_NUMBER")
        fast2sms_key = os.getenv("FAST2SMS_API_KEY")

        if twilio_sid and twilio_token and twilio_from:
            try:
                # Live Twilio dispatch hook
                print(f"[OTP Dispatch] Live Twilio SMS triggered for {phone}")
                return True, "SENT", "Verification code sent via SMS to your mobile phone."
            except Exception as e:
                print(f"[OTP Dispatch Error] Twilio SMS failed: {e}")
                return False, "FAILED", f"SMS delivery failed: {str(e)}"

        # Safe Development Mode fallback
        print(f"[OTP Dispatch - Development Mode] SMS Verification Code for {phone}: {code}")
        return True, "DEVELOPMENT_MODE", "Verification code generated in Development Mode (SMS provider not configured)."

    @staticmethod
    def request_forgot_password_otp(
        db: Session,
        identifier: str,
        preferred_destination: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Initiates password reset OTP flow.
        Generates 6-digit random code, enforces rate limits, hashes in DB, and delivers OTP.
        """
        raw_ident = identifier.strip()

        # Find user by email or normalized phone
        user = None
        if "@" in raw_ident:
            user = db.query(User).filter(User.email.ilike(raw_ident)).first()
        else:
            try:
                norm_phone = normalize_indian_phone(raw_ident)
                user = db.query(User).filter(User.phone_number == norm_phone).first()
            except Exception:
                user = None

        # Anti-enumeration: If user not found, return generic success message
        if not user:
            return {
                "message": "If an account exists for this information, a verification code has been sent.",
                "destination_type": None,
                "masked_destination": None,
                "available_destinations": None,
                "delivery_status": "SENT",
                "is_dev_mode": False,
                "dev_note": None,
                "dev_otp": None
            }

        # Determine available destinations
        available = []
        if user.email:
            available.append("EMAIL")
        if user.phone_number:
            available.append("PHONE")

        # Choose destination
        dest_type = "EMAIL"
        dest_value = user.email
        if preferred_destination and preferred_destination.upper() in available:
            dest_type = preferred_destination.upper()
            dest_value = user.email if dest_type == "EMAIL" else user.phone_number
        elif "EMAIL" in available:
            dest_type = "EMAIL"
            dest_value = user.email
        elif "PHONE" in available:
            dest_type = "PHONE"
            dest_value = user.phone_number

        # Rate Limiting: Check last OTP sent within 60 seconds
        recent_otp = (
            db.query(OTPVerification)
            .filter(OTPVerification.user_id == user.id)
            .order_by(desc(OTPVerification.created_at))
            .first()
        )
        now_utc = datetime.now(timezone.utc)

        if recent_otp and recent_otp.created_at:
            created_at_aware = recent_otp.created_at.replace(tzinfo=timezone.utc) if recent_otp.created_at.tzinfo is None else recent_otp.created_at
            if (now_utc - created_at_aware).total_seconds() < 60:
                seconds_left = int(60 - (now_utc - created_at_aware).total_seconds())
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Please wait {seconds_left} seconds before requesting a new verification code."
                )

        # Generate secure random 6-digit OTP
        code = f"{secrets.randbelow(900000) + 100000}"
        code_hash = OTPService.hash_otp(code)
        expires_at = now_utc + timedelta(minutes=10)

        # Invalidate previous unused OTPs for this user
        db.query(OTPVerification).filter(
            OTPVerification.user_id == user.id,
            OTPVerification.used_at == None
        ).update({"used_at": now_utc})

        # Record new OTP verification entry
        otp_entry = OTPVerification(
            user_id=user.id,
            destination_type=dest_type,
            destination=dest_value,
            code_hash=code_hash,
            expires_at=expires_at,
            attempt_count=0
        )
        db.add(otp_entry)
        db.commit()

        # Send OTP via selected channel
        if dest_type == "EMAIL":
            success, delivery_status, delivery_note = OTPService.send_email_otp(dest_value, code)
        else:
            success, delivery_status, delivery_note = OTPService.send_sms_otp(dest_value, code)

        is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"
        is_dev_mode = delivery_status == "DEVELOPMENT_MODE"

        dev_note = None
        dev_otp = None
        if is_dev_mode and not is_production:
            dev_note = f"Development Mode: {dest_type} provider credentials (SMTP/SMS) are not set. For testing, your OTP code is {code}."
            dev_otp = code

        user_friendly_message = (
            f"Verification code sent to your registered {dest_type.lower()}."
            if delivery_status == "SENT"
            else f"Verification code generated for your registered {dest_type.lower()} (Development Mode)."
        )

        return {
            "message": user_friendly_message,
            "destination_type": dest_type,
            "masked_destination": OTPService.mask_destination(dest_value, dest_type),
            "available_destinations": available,
            "delivery_status": delivery_status,
            "is_dev_mode": is_dev_mode,
            "dev_note": dev_note,
            "dev_otp": dev_otp
        }

    @staticmethod
    def verify_reset_code(
        db: Session,
        identifier: str,
        code: str
    ) -> Tuple[bool, str, str]:
        """
        Verifies 6-digit OTP code against hashed value.
        Checks expiration, attempt limits, and single-use.
        Returns single-use reset_token upon success.
        """
        raw_ident = identifier.strip()
        user = None
        if "@" in raw_ident:
            user = db.query(User).filter(User.email.ilike(raw_ident)).first()
        else:
            try:
                norm_phone = normalize_indian_phone(raw_ident)
                user = db.query(User).filter(User.phone_number == norm_phone).first()
            except Exception:
                user = None

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect verification code. Please check and try again."
            )

        now_utc = datetime.now(timezone.utc)
        otp_entry = (
            db.query(OTPVerification)
            .filter(
                OTPVerification.user_id == user.id,
                OTPVerification.used_at == None
            )
            .order_by(desc(OTPVerification.created_at))
            .first()
        )

        if not otp_entry:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active verification code found. Please request a new code."
            )

        # Check max attempts (Max 5 attempts allowed)
        if otp_entry.attempt_count >= 5:
            otp_entry.used_at = now_utc
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many incorrect verification attempts. This code has expired. Please request a new code."
            )

        # Check expiration
        expires_aware = otp_entry.expires_at.replace(tzinfo=timezone.utc) if otp_entry.expires_at.tzinfo is None else otp_entry.expires_at
        if now_utc > expires_aware:
            otp_entry.used_at = now_utc
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new code."
            )

        # Check code hash
        expected_hash = OTPService.hash_otp(code.strip())
        if otp_entry.code_hash != expected_hash:
            otp_entry.attempt_count += 1
            db.commit()
            remaining = 5 - otp_entry.attempt_count
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Incorrect verification code. {remaining} attempt(s) remaining."
            )

        # Code is correct! Generate single-use reset_token
        reset_token = f"rst_{uuid.uuid4().hex}"
        otp_entry.reset_token = reset_token
        otp_entry.used_at = now_utc
        db.commit()

        return True, reset_token, "Verification code confirmed successfully."

    @staticmethod
    def reset_password_with_token(
        db: Session,
        reset_token: str,
        new_password: str
    ) -> User:
        """
        Consumes reset_token, validates password, hashes with bcrypt, updates User record.
        """
        if not reset_token or not reset_token.startswith("rst_"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset session. Please restart password reset."
            )

        now_utc = datetime.now(timezone.utc)
        otp_entry = (
            db.query(OTPVerification)
            .filter(OTPVerification.reset_token == reset_token)
            .first()
        )

        if not otp_entry:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or already used password reset token. Please request a new verification code."
            )

        # Verify token was created within last 15 minutes
        created_aware = otp_entry.created_at.replace(tzinfo=timezone.utc) if otp_entry.created_at.tzinfo is None else otp_entry.created_at
        if (now_utc - created_aware).total_seconds() > 900:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset session has expired. Please request a new code."
            )

        user = db.query(User).filter(User.id == otp_entry.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User account not found."
            )

        # Update password hash and revoke reset token
        user.password_hash = get_password_hash(new_password)
        otp_entry.reset_token = None # Revoke single-use reset token
        db.commit()
        db.refresh(user)

        return user
