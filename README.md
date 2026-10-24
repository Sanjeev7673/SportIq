# SportIQ — AI-Driven Sports Talent Assessment & Opportunity Discovery Platform

SportIQ is a full-stack platform built for Athletes, Coaches, Scouts, Tournament Organizers, and Administrators to assess athletic talent, verify video drills with AI computer vision, discover verified sports tournaments, and govern sports ecosystems.

---

## 📁 Repository Structure

```text
sportIQ/
├── backend/                  # FastAPI Python Backend
│   ├── app/
│   │   ├── core/             # JWT Security, Config, Dependencies
│   │   ├── database/         # SQLAlchemy Session & Base Metadata
│   │   ├── models/           # User, Player, Performance, Event, AI Models
│   │   ├── routes/           # REST API Routers (Auth, Players, Coach, Scout, Admin, Events, Video)
│   │   ├── schemas/          # Pydantic Schemas & Validation
│   │   ├── services/         # Business Logic, AI Assessment, Query Builders
│   │   └── main.py           # FastAPI Application Entry Point
│   ├── alembic/              # Database Migrations
│   ├── scripts/              # Data Seeding & Maintenance Scripts
│   ├── tests/                # Pytest Automated Test Suite (82+ Tests)
│   ├── uploads/              # Media Upload Storage
│   ├── .env.example          # Backend Environment Template
│   ├── alembic.ini           # Alembic Configuration
│   ├── Procfile              # Production Process Configuration
│   ├── render.yaml           # Cloud Deployment Blueprint
│   └── requirements.txt      # Python Dependencies
│
├── frontend/                 # React + Vite Frontend
│   ├── src/
│   │   ├── assets/           # Static Media & Icons
│   │   ├── components/       # Layouts, Common UI Cards, Modals, Buttons, Charts
│   │   ├── context/          # AuthContext, ThemeContext
│   │   ├── hooks/            # Custom React Hooks
│   │   ├── pages/            # Player, Coach, Scout, Organizer, Admin & Event Hub Pages
│   │   ├── services/         # Axios API Client Services
│   │   ├── utils/            # Constants, Formatting Helpers
│   │   ├── App.jsx           # Route Management & Role-Based Route Guards
│   │   ├── index.css         # Tailwind Directives & Custom Styling
│   │   └── main.jsx          # React Application Root
│   ├── .env.example          # Frontend Environment Template
│   ├── index.html            # HTML5 Entry Template
│   ├── package.json          # Node Dependencies & Build Scripts
│   ├── postcss.config.js     # PostCSS Configuration
│   ├── tailwind.config.js    # Tailwind CSS Design System Configuration
│   ├── vercel.json           # Frontend Deployment Routing Configuration
│   └── vite.config.js        # Vite Build & Dev Server Configuration
│
├── .gitignore                # Root Git Ignore
└── README.md                 # Project Overview & Setup Instructions
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm**
- **PostgreSQL** or **SQLite** (default local development)

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment (Windows)
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run FastAPI development server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### 2. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Configure environment variables
cp .env.example .env

# Run Vite development server
npm run dev
```
Frontend Web Application will be available at: [http://localhost:3000](http://localhost:3000)

---

### 3. Running Automated Tests

```bash
cd backend
pytest tests/ -v
```

---

## 🔐 Default Development Credentials

- **Admin Portal**: `admin@sportiq.ai` / `Admin@SportIQ2026!` (Role: `ADMIN`)
- **Athlete Workspace**: Register via `/register` (Role: `ATHLETE`)
- **Coach Workspace**: Register via `/register` (Role: `COACH`)
- **Scout Workspace**: Register via `/register` (Role: `SCOUT`)
- **Organizer Workspace**: Register via `/register` (Role: `ORGANIZER`)

---

## 📤 Pushing to GitHub

To push this entire project to a new GitHub repository:

```bash
# Initialize git in the root folder (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "feat: complete SportIQ platform with backend and frontend"

# Set branch name to main
git branch -M main

# Add your GitHub remote repository URL
git remote add origin https://github.com/YOUR_USERNAME/sportIQ.git

# Push to GitHub
git push -u origin main
```
