# SportIQ

AI-powered sports talent discovery and performance platform.

## Frontend

- React 18 + Vite
- Development: `npm install` then `npm run dev`
- Production build: `npm run build`

## Required source layout

The current `App.jsx` imports modules from `context/`, `components/layout/`, `pages/`, and `utils/`. Those exact folders and files must be restored for the app to compile.

Recommended full-stack structure:

```text
SportIq/
├── frontend/
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── context/
│       ├── components/layout/
│       ├── pages/
│       │   ├── auth/
│       │   ├── events/
│       │   ├── player/
│       │   ├── coach/
│       │   ├── scout/
│       │   ├── organizer/
│       │   └── admin/
│       ├── utils/
│       └── assets/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── core/
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── .gitignore
└── README.md
```

## Environment and deployment

Keep secrets in hosting environment settings or local ignored env files. Commit only example templates; do not commit credentials, databases, or private uploads. Deploy the Vite frontend from the directory containing its `package.json`; deploy the Python API separately and set `VITE_API_URL` / `VITE_SERVER_URL` to its public base URL.

## Current repair status

The Vite entry-point reference was updated to `/main.jsx` to match the current root-level file. However, the repository still has a flattened layout and the imported `context/`, `components/layout/`, `pages/`, and `utils/` source modules have not been restored. A successful build is not yet confirmed. Restore the original source archive into the correct directories before deploying.
