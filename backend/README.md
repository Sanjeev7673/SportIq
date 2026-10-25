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
Open `/docs` for interactive API docs and `/health` for health checks.

## Render
Set **Root Directory** to `backend`, **Build Command** to `pip install -r requirements.txt`, and **Start Command** to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
Configure `JWT_SECRET_KEY` as a private Render environment variable. Configure `DATABASE_URL` to a managed PostgreSQL database for production. Set `PUBLIC_API_URL` to the deployed API origin to enable QR generation.

## MVP routes
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- `PUT/GET /api/v1/athletes/me/profile`
- `POST /api/v1/athletes/me/videos`, `GET /api/v1/reports`, `GET /api/v1/reports/{id}`, `GET /api/v1/reports/{id}/qr`
- `GET/POST /api/v1/coaches`, `POST /api/v1/bookings`, `GET /api/v1/bookings/me`
- `GET/POST /api/v1/sponsors`, `GET/POST /api/v1/events`, `GET /api/v1/leaderboard`

## Important limitations
- Video upload is capped at 250 MB and currently writes to local disk. Render local filesystems are ephemeral; use object storage (e.g. S3 or Cloudinary) before production.
- The report is a placeholder and does **not** perform computer vision or biomechanical analysis yet. Integrate and validate a pose-estimation pipeline before reporting timing, form scores, strengths or weaknesses as measured facts.
- QR generation requires `PUBLIC_API_URL`. The current report endpoint is authenticated, so do not treat its QR as a public share link. A consent-based expiring share token is needed for sponsor/coach sharing.
- Email/SMS OTP router is currently separate and not mounted in this MVP. Add Twilio Verify configuration and connect verified status to registration and password-reset flows before production.
- Add automated tests, rate limiting, audit logging, role-based sponsor/coach permissions, secure object storage, database migrations and consent controls before production.
