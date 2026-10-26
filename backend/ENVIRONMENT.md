# SportIQ environment variables

Set these where the backend runs. Never commit real secrets.

| Variable | Required | Purpose |
|---|---|---|
| `JWT_SECRET_KEY` | Yes in production | Stable token-signing secret. Without it, a temporary secret is generated and users are logged out after restart. |
| `GEMINI_API_KEY` | For AI review | Without it, pose measurements may be saved but AI review reports `not_configured`. |
| `GEMINI_VISION_MODEL` | Optional | Defaults to `gemini-2.5-flash`. |
| `GEMINI_TIMEOUT_SECONDS` | Optional | Gemini request timeout; defaults to 60 seconds. |
| `DATABASE_URL` | Optional | Defaults to SQLite under `SPORTIQ_DATA_DIR`; use persistent storage for production. |
| `SPORTIQ_DATA_DIR` | Optional | Stores uploads, QR images and the SQLite database. Ephemeral container disks lose these on restart. |
| `BACKEND_CORS_ORIGINS` | Optional | Comma-separated frontend origins. |
| `MAX_VIDEO_MB` | Optional | Max upload size in MB (default `100`; keep in sync with `MAX_VIDEO_MB` in `frontend/src/utils/constants.js`). |
| `ANALYSIS_CONCURRENCY` | Optional | Intended maximum concurrent video analyses; defaults to 2. |

Vercel frontend variable: `VITE_API_URL=https://<real-backend-host>/api/v1`.
GitHub Actions repository variable: `BACKEND_URL=https://<real-backend-host>` (no `/api/v1`); this only enables the optional health smoke test.

**Deployment limitation:** this repository does not itself provide a running FastAPI service. A real backend host and its environment variables must be configured before production sign-in or video analysis can work.
