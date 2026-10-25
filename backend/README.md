# SportIQ Backend MVP

## Run locally
```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
set JWT_SECRET_KEY=replace-with-a-long-random-secret
uvicorn app.main:app --reload
```
Open `/docs` for interactive API docs and `/health` for health checks. Run the unit checks with `python -m unittest discover -s tests -v`.

## Render
Set **Root Directory** to `backend`, **Build Command** to `pip install -r requirements.txt`, and **Start Command** to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
Configure `JWT_SECRET_KEY` as a private Render environment variable. Configure `DATABASE_URL` to a managed PostgreSQL database for production. Set `PUBLIC_API_URL` to the deployed API origin to enable QR generation.

## MVP routes
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/reset-password`
- `POST /api/v1/otp/send` and `POST /api/v1/otp/verify` for email/SMS registration and recovery codes (Twilio Verify configuration required)
- `PUT/GET /api/v1/athletes/me/profile`
- `POST /api/v1/athletes/me/videos`, `GET /api/v1/reports`, `GET /api/v1/reports/{id}`, `GET /api/v1/reports/{id}/qr`
- `GET/POST /api/v1/coaches`, `POST /api/v1/bookings`, `GET /api/v1/bookings/me`
- `GET/POST /api/v1/sponsors`, `GET/POST /api/v1/events`, `GET /api/v1/leaderboard`

## OTP configuration
Configure these private environment variables on Render: `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY`, `TWILIO_API_SECRET`, and `TWILIO_VERIFY_SERVICE_SID`. Set up both SMS and email channels on the Twilio Verify service. Never put these secrets in Vercel/frontend variables.

Registration flow: create the account, request an email OTP with purpose `registration`, verify it, then log in. An optional phone number may be stored in E.164 format and verified by SMS. Forgot-password flow: request OTP to the registered email or phone with purpose `forgot_password`, verify it, then submit the returned short-lived `reset_token` and new password to `POST /api/v1/auth/reset-password`. Reset grants expire in 10 minutes and are single-use.

## Important limitations
- Video upload is capped at 250 MB and currently writes to local disk. Render local filesystems are ephemeral; use object storage (e.g. S3 or Cloudinary) before production.
- Video uploads now invoke an experimental pose-analysis module. Install `opencv-python-headless` and `mediapipe` in the backend environment to enable landmark sampling; if those packages are unavailable, analysis reports that clearly. The module reports sampled-frame pose detection and approximate 2D knee-angle ranges only. It does **not** provide validated sprint timing, jump distance/height, hurdle scores, injury risk, or competition-grade rankings. Camera angle, occlusion, lighting, and motion blur can affect results; qualified coach review is required.
- QR generation requires `PUBLIC_API_URL`. The current report endpoint is authenticated, so do not treat its QR as a public share link. A consent-based expiring share token is needed for sponsor/coach sharing.
- OTP routes are mounted and the email/SMS verification flow is wired to account verification/reset grants, but live delivery is untested until valid Twilio credentials and channel setup are configured. The reset token is returned to the client after successful OTP verification; production should deliver the reset grant through a hardened flow and add rate limits, resend cooldowns, and abuse monitoring.
- Add automated tests, rate limiting, audit logging, role-based sponsor/coach permissions, secure object storage, database migrations and consent controls before production.
