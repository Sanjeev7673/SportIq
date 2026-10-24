# SportIQ — AI Sports Talent Assessment & Opportunity Discovery Platform

SportIQ is a React/Vite frontend for sports talent discovery, performance tracking, coach/scout workflows, and event management.

## Repository structure

```text
SportIq/
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/
│       │   ├── auth/
│       │   ├── charts/
│       │   ├── coach/
│       │   ├── common/
│       │   ├── layout/
│       │   ├── player/
│       │   └── scout/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       │   ├── admin/
│       │   ├── auth/
│       │   ├── coach/
│       │   ├── events/
│       │   ├── organizer/
│       │   ├── player/
│       │   └── scout/
│       ├── services/
│       └── utils/
├── .gitignore
└── README.md
```

## Run the frontend locally

1. `cd frontend`
2. `npm install`
3. Copy `.env.example` to `.env.local` and set the API URLs.
4. `npm run dev`

Production build: `npm run build`.

## Environment safety

Do not commit real environment files, secrets, local databases, or private uploads. The root `.gitignore` excludes these. Use hosting environment settings for production values.

## Vercel

The Vercel project is configured to use `frontend` as its Root Directory, with `npm install`, `npm run build`, and `dist` as the output directory.

## Backend status

The original archive includes a FastAPI backend, but the backend source has not yet been restored to this GitHub repository. The frontend therefore still requires a separately deployed API and correctly configured `VITE_API_URL` / `VITE_SERVER_URL` values before all live features can work end-to-end.
