# SportIQ OTP integration

This folder contains a reusable FastAPI router for email and SMS OTP verification using Twilio Verify.

## Current status
The FastAPI backend now mounts this router at /api/v1/otp. Live delivery still requires Twilio Verify credentials and an email integration plus SMS channel. Verify registration and password-reset end to end after configuring the provider.

## Provider configuration
1. Create a Twilio Verify Service.
2. Enable SMS and configure the email integration in Twilio Console. Twilio's email channel requires an email integration linked to the Verify Service.
3. Configure these values privately on the backend host, not in Vercel frontend environment variables: TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET, TWILIO_VERIFY_SERVICE_SID.
4. Install dependencies from backend/requirements-otp.txt.
5. In the existing FastAPI app, import the router and mount it with the API prefix:
   from backend.otp_router import router as otp_router
   app.include_router(otp_router, prefix="/api/v1")
   Adjust the import to match the actual backend package structure.
6. Deploy the backend and confirm both OTP routes appear in the API schema.

## API payloads
Send: { "purpose": "registration", "channel": "email", "destination": "test@example.com" }
The purpose must be registration or forgot_password; channel must be email or sms. SMS destinations must use international E.164 format, including the + and country code.

Verify: { "purpose": "forgot_password", "channel": "sms", "destination": "+14155552671", "code": "123456" }

## Required before production
- Connect successful verification to the existing user database and auth logic. Do not create/activate accounts until registration verification is complete.
- For password reset, issue a short-lived, single-use server-side reset token only after verification. Do not authorize a password change using a client-side boolean alone.
- Add rate limits, resend cooldowns, abuse monitoring, and generic responses that do not disclose account existence.
- If product policy requires both email and SMS to be verified, enforce both server-side. The current router verifies one destination per request.
- Test actual email/SMS delivery plus invalid, expired, and rate-limited codes. Twilio trial accounts may send only to verified destinations.

Live delivery has not been tested; it requires real provider credentials. The reset token is returned only after successful OTP verification and expires after 10 minutes. Add rate limiting, resend cooldowns, and monitoring before production.
