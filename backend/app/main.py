"""SportIQ API MVP: athlete profiles, reports, coaches, sponsors, events and bookings.

AI video analysis is intentionally represented as a clearly labelled baseline report until
a validated pose-estimation/model pipeline is connected. Do not present baseline metrics
as scientifically measured athletic performance.
"""
from __future__ import annotations

import asyncio
import os
import smtplib
from email.message import EmailMessage
import secrets
import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

import qrcode
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table as PDFTable, TableStyle, Image as PDFImage
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

APP_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(os.getenv("SPORTIQ_DATA_DIR", str(APP_DIR.parent / "data")))
UPLOAD_DIR = DATA_DIR / "videos"
QR_DIR = DATA_DIR / "qr"
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
QR_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'sportiq.db'}")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "")
if not JWT_SECRET:
    # Suitable only for local development; configure a stable secret in production.
    # A random secret changes on every restart and logs every user out.
    JWT_SECRET = secrets.token_urlsafe(48)
    print("WARNING: JWT_SECRET_KEY is not set; using a temporary secret. Set it in the backend environment.", flush=True)
JWT_ALGORITHM = "HS256"
TOKEN_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))

# Bound expensive video analysis to avoid exhausting CPU/memory under concurrent uploads.
ANALYSIS_SLOTS = asyncio.Semaphore(max(1, int(os.getenv("ANALYSIS_CONCURRENCY", "2"))))

def overall_report_status(pose_status: str, ai_status: str) -> str:
    pose_ok = pose_status == "pose_metrics_available"
    ai_ok = ai_status == "complete"
    if pose_ok and ai_ok: return "complete"
    if pose_ok: return "partial_pose_only"
    if ai_ok: return "partial_ai_only"
    return "analysis_incomplete"

def load_metrics(raw: str | None) -> dict:
    try:
        value = json.loads(raw or "{}")
        return value if isinstance(value, dict) else {}
    except (TypeError, ValueError):
        return {}

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, index=True, nullable=True)
    phone_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="athlete")
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class EmailVerificationGrant(Base):
    __tablename__ = "email_verification_grants"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class PasswordResetGrant(Base):
    __tablename__ = "password_reset_grants"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class ReportShare(Base):
    __tablename__ = "report_shares"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("performance_reports.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class AthleteProfile(Base):
    __tablename__ = "athlete_profiles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    sport: Mapped[str] = mapped_column(String(80))
    discipline: Mapped[str] = mapped_column(String(100), default="")
    age: Mapped[int] = mapped_column(Integer)
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    gender: Mapped[str] = mapped_column(String(40), default="prefer_not_to_say")
    location: Mapped[str] = mapped_column(String(160), default="")
    bio: Mapped[str] = mapped_column(Text, default="")

class PerformanceReport(Base):
    __tablename__ = "performance_reports"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    athlete_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    sport: Mapped[str] = mapped_column(String(80))
    discipline: Mapped[str] = mapped_column(String(100), default="")
    video_filename: Mapped[str] = mapped_column(String(255))
    notes: Mapped[str] = mapped_column(Text, default="")
    strengths: Mapped[str] = mapped_column(Text, default="")
    improvements: Mapped[str] = mapped_column(Text, default="")
    analysis_status: Mapped[str] = mapped_column(String(30), default="baseline_pending_ai")
    analysis_metrics: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class Coach(Base):
    __tablename__ = "coaches"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(120))
    sports: Mapped[str] = mapped_column(String(255))
    location: Mapped[str] = mapped_column(String(160), default="")
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    bio: Mapped[str] = mapped_column(Text, default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True)

class Sponsor(Base):
    __tablename__ = "sponsors"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company_name: Mapped[str] = mapped_column(String(160))
    sports: Mapped[str] = mapped_column(String(255))
    location: Mapped[str] = mapped_column(String(160), default="")
    budget_min_inr: Mapped[int] = mapped_column(Integer, default=0)
    budget_max_inr: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str] = mapped_column(Text, default="")
    contact_email: Mapped[str] = mapped_column(String(254), default="")

class SportEvent(Base):
    __tablename__ = "sport_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(180))
    sport: Mapped[str] = mapped_column(String(80))
    event_type: Mapped[str] = mapped_column(String(80), default="competition")
    venue: Mapped[str] = mapped_column(String(180))
    location: Mapped[str] = mapped_column(String(160))
    starts_at: Mapped[datetime] = mapped_column(DateTime)
    registration_url: Mapped[str] = mapped_column(String(500), default="")
    description: Mapped[str] = mapped_column(Text, default="")

class Booking(Base):
    __tablename__ = "coach_bookings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    athlete_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    coach_id: Mapped[int] = mapped_column(ForeignKey("coaches.id"), index=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime)
    message: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

Base.metadata.create_all(bind=engine)

# Small compatibility migration for an existing SQLite/PostgreSQL database. New deployments
# create these fields from the model above; duplicate-column errors are intentionally ignored.
with engine.begin() as connection:
    for migration in (
        "ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN phone VARCHAR(20)",
        "ALTER TABLE users ADD COLUMN phone_verified BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE performance_reports ADD COLUMN analysis_metrics TEXT NOT NULL DEFAULT '{}'",
    ):
        try:
            connection.exec_driver_sql(migration)
        except Exception:
            pass

app = FastAPI(title="SportIQ API", version="0.1.0", description="Athlete development and sports networking platform API")
origins = [x.strip() for x in os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,https://sportiq-theta.vercel.app").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_origin_regex=r"^https://.*\.vercel\.app$", allow_credentials=True, allow_methods=["*"], allow_headers=["*"])



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": str(user.id), "role": user.role, "iat": now, "exp": now + timedelta(minutes=TOKEN_MINUTES)}, JWT_SECRET, algorithm=JWT_ALGORITHM)

from fastapi import Header
def get_current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload.get("sub", ""))
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired access token")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Account not found")
    return user

class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, pattern=r"^\+[1-9]\d{7,14}$")
    password: str = Field(min_length=8, max_length=72)
    role: Literal["PLAYER", "COACH", "SCOUT", "ORGANIZER", "ADMIN", "ATHLETE", "SPONSOR", "athlete", "coach", "scout", "organizer", "admin", "sponsor"] = "PLAYER"

class LoginIn(BaseModel):
    email: EmailStr | None = None
    username: EmailStr | None = None
    password: str

class ResetPasswordIn(BaseModel):
    reset_token: str = Field(min_length=32, max_length=256)
    new_password: str = Field(min_length=8, max_length=72)

class ProfileIn(BaseModel):
    sport: str = Field(min_length=2, max_length=80)
    discipline: str = Field(default="", max_length=100)
    age: int = Field(ge=5, le=100)
    height_cm: float | None = Field(default=None, gt=0, le=260)
    weight_kg: float | None = Field(default=None, gt=0, le=400)
    gender: str = Field(default="prefer_not_to_say", max_length=40)
    location: str = Field(default="", max_length=160)
    bio: str = Field(default="", max_length=2000)

class BookingIn(BaseModel):
    coach_id: int
    starts_at: datetime
    message: str = Field(default="", max_length=1000)

class CoachIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    sports: str = Field(min_length=2, max_length=255)
    location: str = Field(default="", max_length=160)
    experience_years: int = Field(default=0, ge=0, le=80)
    bio: str = Field(default="", max_length=2000)

class SponsorIn(BaseModel):
    company_name: str = Field(min_length=2, max_length=160)
    sports: str = Field(min_length=2, max_length=255)
    location: str = Field(default="", max_length=160)
    budget_min_inr: int = Field(default=0, ge=0)
    budget_max_inr: int = Field(default=0, ge=0)
    description: str = Field(default="", max_length=2000)
    contact_email: EmailStr

class EventIn(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    sport: str = Field(min_length=2, max_length=80)
    event_type: str = Field(default="competition", max_length=80)
    venue: str = Field(min_length=2, max_length=180)
    location: str = Field(min_length=2, max_length=160)
    starts_at: datetime
    registration_url: str = Field(default="", max_length=500)
    description: str = Field(default="", max_length=3000)

def user_json(u: User):
    role_alias = {"athlete": "PLAYER", "player": "PLAYER", "coach": "COACH", "scout": "SCOUT", "organizer": "ORGANIZER", "admin": "ADMIN", "sponsor": "ORGANIZER"}
    return {"id": u.id, "name": u.name, "email": u.email, "role": role_alias.get(u.role.lower(), u.role.upper()), "email_verified": u.email_verified, "phone": u.phone, "phone_verified": u.phone_verified, "created_at": u.created_at.isoformat()}

@app.get("/")
def root():
    return {"name": "SportIQ API", "status": "ok", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "sportiq-api", "timestamp": datetime.now(timezone.utc).isoformat()}

def send_verification_email(email: str, token: str) -> None:
    host = os.getenv("SMTP_HOST", "").strip()
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASSWORD", "")
    from_email = os.getenv("SMTP_FROM_EMAIL", user).strip()
    api_url = os.getenv("PUBLIC_API_URL", "").rstrip("/")
    if not all((host, user, password, from_email, api_url)):
        raise HTTPException(status_code=503, detail="Email verification is not configured on the server. Please contact the administrator.")
    link = f"{api_url}/api/v1/auth/verify-email?token={token}"
    message = EmailMessage()
    message["Subject"] = "Verify your SportIQ email"
    message["From"] = f'{os.getenv("SMTP_FROM_NAME", "SportIQ")} <{from_email}>'
    message["To"] = email
    message.set_content(f"Welcome to SportIQ. Verify your email using this link (valid for 30 minutes): {link}")
    message.add_alternative(f'<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Welcome to SportIQ</h2><p>Verify your email to activate your account.</p><p><a style="display:inline-block;padding:12px 20px;background:#ef2929;color:white;text-decoration:none;border-radius:8px" href="{link}">Verify my email</a></p><p>This link expires in 30 minutes. If you did not create this account, ignore this email.</p></div>', subtype="html")
    port = int(os.getenv("SMTP_PORT", "587"))
    try:
        if os.getenv("SMTP_USE_SSL", "false").lower() == "true":
            with smtplib.SMTP_SSL(host, port, timeout=15) as server:
                server.login(user, password); server.send_message(message)
        else:
            with smtplib.SMTP(host, port, timeout=15) as server:
                server.ehlo()
                if os.getenv("SMTP_USE_TLS", "true").lower() == "true":
                    server.starttls(); server.ehlo()
                server.login(user, password); server.send_message(message)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="We could not send the verification email. Check the email service configuration and try again.") from exc

@app.post("/api/v1/auth/register", status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    """Create an account without email verification during the initial platform test phase."""
    email = str(payload.email).lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    normalized_roles = {"PLAYER": "athlete", "ATHLETE": "athlete", "COACH": "coach", "SCOUT": "scout", "ORGANIZER": "organizer", "ADMIN": "admin", "SPONSOR": "sponsor"}
    role = normalized_roles.get(payload.role.upper(), "athlete")
    user = User(name=payload.name.strip(), email=email, phone=payload.phone, password_hash=pwd_context.hash(payload.password), role=role, email_verified=False)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"success": True, "verification_required": False, "message": "Account created successfully. You can sign in now."}

@app.get("/api/v1/auth/verify-email", response_class=HTMLResponse)
def verify_email(token: str, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    grant = db.query(EmailVerificationGrant).filter(EmailVerificationGrant.token_hash == token_hash).first()
    now = datetime.now(timezone.utc)
    if not grant or grant.used_at is not None or grant.expires_at.replace(tzinfo=timezone.utc) < now:
        return HTMLResponse("<h2>SportIQ email verification failed</h2><p>This link is invalid or expired. Please register again or request a new link.</p>", status_code=400)
    user = db.get(User, grant.user_id)
    if not user:
        return HTMLResponse("<h2>SportIQ email verification failed</h2><p>Account not found.</p>", status_code=400)
    user.email_verified = True
    grant.used_at = now
    db.commit()
    return HTMLResponse("<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'><title>SportIQ email verified</title></head><body style='font-family:Arial,sans-serif;background:#f6f7fb;padding:40px;text-align:center'><main style='max-width:520px;margin:10vh auto;background:white;padding:36px;border-radius:18px'><h1 style='color:#16a34a'>Email verified!</h1><p>Your SportIQ account is activated. You can now sign in.</p><a style='display:inline-block;background:#ef2929;color:white;padding:12px 22px;border-radius:8px;text-decoration:none' href='https://sportiq-theta.vercel.app/login'>Go to SportIQ login</a></main></body></html>")

@app.post("/api/v1/auth/login")
def login(payload: LoginIn, db: Session = Depends(get_db)):
    identifier = str(payload.email or payload.username or "").lower().strip()
    user = db.query(User).filter(User.email == identifier).first()
    if not user or not pwd_context.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    # Email verification will be enabled after the initial end-to-end platform test.
    return {"success": True, "user": user_json(user), "access_token": create_token(user), "token_type": "bearer"}

@app.post("/api/v1/auth/reset-password")
def reset_password(payload: ResetPasswordIn, db: Session = Depends(get_db)):
    token_hash = __import__("hashlib").sha256(payload.reset_token.encode("utf-8")).hexdigest()
    grant = db.query(PasswordResetGrant).filter(PasswordResetGrant.token_hash == token_hash).first()
    now = datetime.now(timezone.utc)
    if not grant or grant.used_at is not None or grant.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status_code=400, detail="Reset token is invalid or expired. Request a new code.")
    user = db.get(User, grant.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="Reset token is invalid or expired. Request a new code.")
    user.password_hash = pwd_context.hash(payload.new_password)
    grant.used_at = now
    db.commit()
    return {"success": True, "message": "Password reset successfully. You can now log in."}

@app.get("/api/v1/auth/me")
def me(user: User = Depends(get_current_user)):
    return {"success": True, "user": user_json(user)}

@app.put("/api/v1/athletes/me/profile")
def save_profile(payload: ProfileIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "athlete":
        raise HTTPException(status_code=403, detail="Athlete accounts only")
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == user.id).first()
    if not profile:
        profile = AthleteProfile(user_id=user.id, **payload.model_dump()); db.add(profile)
    else:
        for key, value in payload.model_dump().items(): setattr(profile, key, value)
    db.commit(); db.refresh(profile)
    return {"success": True, "profile": {"id": profile.id, "user_id": profile.user_id, **payload.model_dump()}}

@app.get("/api/v1/athletes/me/profile")
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == user.id).first()
    if not profile: raise HTTPException(status_code=404, detail="Complete your athlete profile first")
    return {"success": True, "profile": {c.name: getattr(profile, c.name) for c in AthleteProfile.__table__.columns}}

@app.post("/api/v1/athletes/me/videos", status_code=201)
async def upload_performance_video(sport: str = Form(...), discipline: str = Form(default=""), notes: str = Form(default=""), video: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "athlete": raise HTTPException(status_code=403, detail="Athlete accounts only")
    allowed = {"video/mp4", "video/quicktime", "video/webm", "video/x-matroska"}
    ext = Path(video.filename or "upload.mp4").suffix.lower()
    # Some browsers send application/octet-stream for .mov/.mkv; accept those only with a valid extension.
    if video.content_type not in allowed and not (ext in {".mp4", ".mov", ".webm", ".mkv"} and video.content_type in (None, "", "application/octet-stream")):
        raise HTTPException(status_code=415, detail="Upload an MP4, MOV, WebM or MKV video")
    if ext not in {".mp4", ".mov", ".webm", ".mkv"}: ext = ".mp4"
    filename = f"athlete_{user.id}_{secrets.token_hex(12)}{ext}"
    target = UPLOAD_DIR / filename
    size = 0
    try:
        with target.open("wb") as out:
            while chunk := await video.read(1024 * 1024):
                size += len(chunk)
                if size > 250 * 1024 * 1024: raise HTTPException(status_code=413, detail="Video exceeds 250 MB limit")
                out.write(chunk)
    except Exception:
        target.unlink(missing_ok=True); raise
    finally:
        await video.close()
    try:
        async with ANALYSIS_SLOTS:
            # Experimental 2D pose estimation; not a validated sports performance score.
            from app.sport_analysis import analyze_video
            analysis = await run_in_threadpool(analyze_video, target, sport.strip(), discipline.strip())
            if analysis["status"] in ("video_read_failed", "analysis_failed"):
                target.unlink(missing_ok=True)
                detail = "The server could not read this video. Re-export it as H.264 MP4 and try again." if analysis["status"] == "video_read_failed" else analysis.get("summary", "Pose analysis failed.")
                raise HTTPException(status_code=422, detail=detail)
            from app.gemini_video_review import analyze_keyframes_with_gemini
            ai_review = await run_in_threadpool(analyze_keyframes_with_gemini, target, sport.strip(), discipline.strip())
            analysis["ai_coach_review"] = ai_review
            strengths = analysis.get("summary", "Video received; pose analysis did not produce measurements.")
            if ai_review.get("status") == "complete":
                strengths = ai_review.get("summary", strengths)
                if analysis["status"] == "pose_metrics_available":
                    strengths += " Separate experimental 2D pose measurements are also available below."
            elif analysis["status"] == "pose_metrics_available":
                strengths += " Available measurements are experimental and should be reviewed by a qualified coach."
            improvements_parts = ["Limitations: " + " ".join(analysis.get("limitations", []))]
            if ai_review.get("status") == "complete":
                if ai_review.get("recommendations"):
                    improvements_parts.append("AI coaching cues: " + " ".join(ai_review["recommendations"]))
                if ai_review.get("limitations"):
                    improvements_parts.append("AI review limitations: " + " ".join(ai_review["limitations"]))
            else:
                improvements_parts.append(ai_review.get("summary", "AI coach review was not completed."))
            improvements = " ".join(improvements_parts)
            metrics = dict(analysis.get("metrics", {}))
            metrics["ai_coach_review"] = ai_review
            report_status = {"pose_analysis": analysis["status"], "ai_review": ai_review.get("status", "unknown"), "overall": overall_report_status(analysis["status"], ai_review.get("status", ""))}
            if ai_review.get("error_code"):
                report_status["ai_error_code"] = ai_review["error_code"]
            metrics["report_status"] = report_status
            report = PerformanceReport(athlete_id=user.id, sport=sport.strip(), discipline=discipline.strip(), video_filename=filename, notes=notes.strip(), strengths=strengths, improvements=improvements, analysis_status=analysis["status"], analysis_metrics=json.dumps(metrics))
            db.add(report); db.commit(); db.refresh(report)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        target.unlink(missing_ok=True)
        print(f"Video report generation failed: {type(exc).__name__}", flush=True)
        raise HTTPException(status_code=500, detail="Report generation failed on the server. Please try again.") from exc
    return {"success": True, "report_id": report.id, "analysis_status": report.analysis_status, "report_status": report_status, "analysis": analysis, "uploaded_bytes": size, "message": "Video saved. Experimental pose metrics are not a validated athletic performance score."}

@app.get("/api/v1/reports")
def list_reports(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reports = db.query(PerformanceReport).filter(PerformanceReport.athlete_id == user.id).order_by(PerformanceReport.created_at.desc()).all()
    return {"success": True, "reports": [report_json(r, db) for r in reports]}

def report_json(r: PerformanceReport, db: Session):
    athlete = db.get(User, r.athlete_id)
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == r.athlete_id).first()
    return {"id": r.id, "athlete_id": r.athlete_id, "athlete_name": (athlete.name if athlete and athlete.name.strip() else "Athlete"), "athlete_profile": ({"age": profile.age, "height_cm": profile.height_cm, "weight_kg": profile.weight_kg, "sport": profile.sport, "discipline": profile.discipline} if profile else None), "sport": r.sport, "discipline": r.discipline, "video_filename": r.video_filename, "notes": r.notes, "strengths": r.strengths, "improvements": r.improvements, "analysis_status": r.analysis_status, "analysis_metrics": load_metrics(r.analysis_metrics), "created_at": r.created_at.isoformat(), "qr_url": f"/api/v1/reports/{r.id}/qr", "pdf_url": f"/api/v1/reports/{r.id}/pdf"}

def owned_report(report_id: int, user: User, db: Session):
    r = db.get(PerformanceReport, report_id)
    if not r or (r.athlete_id != user.id and user.role != "admin"): raise HTTPException(status_code=404, detail="Report not found")
    return r

@app.get("/api/v1/reports/{report_id}")
def get_report(report_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"success": True, "report": report_json(owned_report(report_id, user, db), db)}

@app.get("/api/v1/reports/{report_id}/pdf")
def download_report_pdf(report_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    report = owned_report(report_id, user, db)
    athlete = db.get(User, report.athlete_id)
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == report.athlete_id).first()
    metrics = load_metrics(report.analysis_metrics)
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=16*mm, bottomMargin=16*mm)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="SportIQTitle", parent=styles["Title"], textColor=colors.HexColor("#063B5C"), fontSize=22, leading=26, spaceAfter=4))
    styles.add(ParagraphStyle(name="SmallMuted", parent=styles["BodyText"], textColor=colors.HexColor("#526274"), fontSize=8, leading=11))
    story = [Paragraph("SportIQ", styles["SportIQTitle"]), Paragraph("VIDEO PERFORMANCE ANALYSIS REPORT", styles["Heading2"]), Spacer(1, 5*mm)]
    status_labels = {"pose_metrics_available":"Experimental pose measurements available","insufficient_pose_visibility":"Insufficient pose visibility","video_read_failed":"Video could not be decoded","pose_analysis_unavailable":"Pose analysis unavailable"}
    info = [
        ["Athlete", athlete.name if athlete and athlete.name.strip() else "Athlete", "Athlete ID", str(report.athlete_id)],
        ["Report ID", f"SQ-{report.id:06d}", "Report date", report.created_at.strftime("%d %b %Y %H:%M UTC")],
        ["Sport", report.sport or "Unspecified", "Activity / drill", report.discipline or "General video review"],
        ["Video file", report.video_filename, "Analysis status", status_labels.get(report.analysis_status, report.analysis_status.replace("_"," ").title())],
    ]
    if profile:
        info.append(["Profile age", str(profile.age) if profile.age else "Not provided", "Height / weight", f"{profile.height_cm or '—'} cm / {profile.weight_kg or '—'} kg"])
    table = PDFTable(info, colWidths=[27*mm, 58*mm, 28*mm, 55*mm])
    table.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#F2F7FA")),("TEXTCOLOR",(0,0),(-1,-1),colors.HexColor("#163247")),("GRID",(0,0),(-1,-1),0.4,colors.HexColor("#D5E1E8")),("FONTNAME",(0,0),(-1,-1),"Helvetica"),("FONTSIZE",(0,0),(-1,-1),8),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6)]))
    story.extend([table, Spacer(1, 7*mm), Paragraph("ANALYSIS SUMMARY", styles["Heading2"]), Paragraph((report.strengths or "No analysis summary available.").replace("&","&amp;").replace("<","&lt;").replace(">","&gt;"), styles["BodyText"]), Spacer(1, 4*mm), Paragraph("OBSERVED VIDEO METRICS", styles["Heading2"])])
    metric_rows = [["Metric", "Observed value", "Interpretation"]]
    for key, value in metrics.items():
        if isinstance(value, dict) and "mean" in value:
            unit = "°" if "angle" in key else ""
            observed = f'{value.get("mean","—")}{unit} (range {value.get("minimum","—")}–{value.get("maximum","—")}{unit}; n={value.get("samples","—")})'
        elif value is not None and not isinstance(value, (dict, list)):
            observed = str(value) + ("%" if "percent" in key else "")
        else:
            continue
        metric_rows.append([key.replace("_"," ").title(), observed, "Experimental 2D computer-vision observation"])
    if len(metric_rows) == 1:
        metric_rows.append(["No measurable metrics", "—", "The model did not return usable measurements for this video"])
    mt = PDFTable(metric_rows, colWidths=[48*mm, 55*mm, 65*mm], repeatRows=1)
    mt.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor("#063B5C")),("TEXTCOLOR",(0,0),(-1,0),colors.white),("GRID",(0,0),(-1,-1),0.35,colors.HexColor("#D5E1E8")),("FONTSIZE",(0,0),(-1,-1),8),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),5),("RIGHTPADDING",(0,0),(-1,-1),5),("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5)]))
    story.extend([mt, Spacer(1, 5*mm), Paragraph("AREAS TO REVIEW / LIMITATIONS", styles["Heading2"]), Paragraph((report.improvements or "No additional limitations were returned.").replace("&","&amp;").replace("<","&lt;").replace(">","&gt;"), styles["BodyText"])])
    if report.notes:
        story.extend([Spacer(1, 4*mm), Paragraph("ATHLETE NOTES", styles["Heading2"]), Paragraph(report.notes.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;"), styles["BodyText"])])
    qr_target = f"https://sportiq-theta.vercel.app/player/video-analysis?report={report.id}"
    qr_image = qrcode.make(qr_target)
    qr_buffer = BytesIO()
    qr_image.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)
    story.extend([Spacer(1, 6*mm), PDFImage(qr_buffer, width=28*mm, height=28*mm), Paragraph("QR opens SportIQ video analysis. Sign-in may be required to view the full report.", styles["SmallMuted"]), Spacer(1, 3*mm), Paragraph("Important: These are experimental 2D video observations, not a validated athletic score, medical opinion, or injury-risk assessment. Camera angle, lighting, framing and occlusion affect accuracy. Review findings with a qualified coach.", styles["SmallMuted"])])
    doc.build(story)
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="SportIQ-Report-{report.id}.pdf"'})

@app.get("/api/v1/reports/{report_id}/qr")
def report_qr(report_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = owned_report(report_id, user, db)
    public_base = os.getenv("PUBLIC_API_URL", "").rstrip("/")
    if not public_base: raise HTTPException(status_code=503, detail="Set PUBLIC_API_URL before generating shareable QR codes")
    # Generating a QR is the user's explicit action to create a limited public share link.
    # Only a redacted report summary is exposed; the uploaded video and private notes are excluded.
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc)
    share = ReportShare(report_id=r.id, token_hash=token_hash, expires_at=now + timedelta(days=7))
    db.add(share)
    db.commit()
    qr_path = QR_DIR / f"report_{r.id}_{user.id}_{secrets.token_hex(4)}.png"
    qrcode.make(f"{public_base}/api/v1/public/reports/{raw_token}").save(qr_path)
    return FileResponse(qr_path, media_type="image/png", filename=f"sportiq-report-{r.id}-qr.png")

@app.get("/api/v1/public/reports/{share_token}")
def get_public_shared_report(share_token: str, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(share_token.encode("utf-8")).hexdigest()
    share = db.query(ReportShare).filter(ReportShare.token_hash == token_hash).first()
    now = datetime.now(timezone.utc)
    if not share or share.revoked_at is not None or share.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status_code=404, detail="Shared report link is invalid or expired")
    report = db.get(PerformanceReport, share.report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    athlete = db.get(User, report.athlete_id)
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == report.athlete_id).first()
    return {
        "success": True,
        "report": {
            "sport": report.sport,
            "discipline": report.discipline,
            "analysis_status": report.analysis_status,
            "strengths": report.strengths,
            "improvements": report.improvements,
            "created_at": report.created_at.isoformat(),
            "athlete_name": athlete.name if athlete else "Athlete",
            "profile": {"age": profile.age, "height_cm": profile.height_cm, "weight_kg": profile.weight_kg} if profile else None,
            "share_expires_at": share.expires_at.isoformat(),
        },
    }

@app.get("/api/v1/coaches")
def list_coaches(sport: str | None = None, location: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Coach).filter(Coach.active.is_(True))
    if sport: query = query.filter(Coach.sports.ilike(f"%{sport}%"))
    if location: query = query.filter(Coach.location.ilike(f"%{location}%"))
    rows = query.order_by(Coach.experience_years.desc()).all()
    return {"success": True, "coaches": [{"id":c.id,"name":c.name,"sports":c.sports,"location":c.location,"experience_years":c.experience_years,"bio":c.bio} for c in rows]}

@app.post("/api/v1/coaches", status_code=201)
def create_coach(payload: CoachIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "coach": raise HTTPException(status_code=403, detail="Coach accounts only")
    row = Coach(user_id=user.id, **payload.model_dump()); db.add(row); db.commit(); db.refresh(row)
    return {"success": True, "coach_id": row.id}

@app.post("/api/v1/bookings", status_code=201)
def create_booking(payload: BookingIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "athlete": raise HTTPException(status_code=403, detail="Athlete accounts only")
    if payload.starts_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc): raise HTTPException(status_code=422, detail="Booking time must be in the future")
    coach = db.get(Coach, payload.coach_id)
    if not coach or not coach.active: raise HTTPException(status_code=404, detail="Coach not found")
    booking = Booking(athlete_id=user.id, coach_id=coach.id, starts_at=payload.starts_at, message=payload.message)
    db.add(booking); db.commit(); db.refresh(booking)
    return {"success": True, "booking": {"id":booking.id,"coach_id":booking.coach_id,"starts_at":booking.starts_at.isoformat(),"status":booking.status}}

@app.get("/api/v1/bookings/me")
def my_bookings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Booking).filter(Booking.athlete_id == user.id).order_by(Booking.starts_at.asc()).all()
    return {"success": True, "bookings": [{"id":b.id,"coach_id":b.coach_id,"starts_at":b.starts_at.isoformat(),"status":b.status,"message":b.message} for b in rows]}

@app.get("/api/v1/sponsors")
def list_sponsors(sport: str | None = None, location: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Sponsor)
    if sport: query = query.filter(Sponsor.sports.ilike(f"%{sport}%"))
    if location: query = query.filter(Sponsor.location.ilike(f"%{location}%"))
    rows = query.order_by(Sponsor.budget_max_inr.desc()).all()
    return {"success": True, "sponsors": [{"id":s.id,"company_name":s.company_name,"sports":s.sports,"location":s.location,"budget_min_inr":s.budget_min_inr,"budget_max_inr":s.budget_max_inr,"description":s.description,"contact_email":s.contact_email} for s in rows]}

@app.post("/api/v1/sponsors", status_code=201)
def create_sponsor(payload: SponsorIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "sponsor": raise HTTPException(status_code=403, detail="Sponsor accounts only")
    if payload.budget_max_inr and payload.budget_max_inr < payload.budget_min_inr: raise HTTPException(status_code=422, detail="Maximum budget must be at least the minimum")
    row = Sponsor(**payload.model_dump()); db.add(row); db.commit(); db.refresh(row)
    return {"success": True, "sponsor_id": row.id}

@app.get("/api/v1/events")
def list_events(sport: str | None = None, location: str | None = None, db: Session = Depends(get_db)):
    query = db.query(SportEvent).filter(SportEvent.starts_at >= datetime.now(timezone.utc).replace(tzinfo=None))
    if sport: query = query.filter(SportEvent.sport.ilike(f"%{sport}%"))
    if location: query = query.filter(SportEvent.location.ilike(f"%{location}%"))
    rows = query.order_by(SportEvent.starts_at.asc()).all()
    return {"success": True, "events": [{"id":e.id,"title":e.title,"sport":e.sport,"event_type":e.event_type,"venue":e.venue,"location":e.location,"starts_at":e.starts_at.isoformat(),"registration_url":e.registration_url,"description":e.description} for e in rows]}

@app.post("/api/v1/events", status_code=201)
def create_event(payload: EventIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in {"coach", "sponsor", "admin"}: raise HTTPException(status_code=403, detail="Only coaches or administrators can submit events")
    row = SportEvent(**payload.model_dump()); db.add(row); db.commit(); db.refresh(row)
    return {"success": True, "event_id": row.id}

@app.get("/api/v1/leaderboard")
def leaderboard(sport: str | None = None, discipline: str | None = None, limit: int = 20, db: Session = Depends(get_db)):
    # MVP leaderboard ranks by count of submitted reports, not by unverified performance metrics.
    limit = max(1, min(limit, 100))
    query = db.query(User, AthleteProfile).join(AthleteProfile, AthleteProfile.user_id == User.id).filter(User.role == "athlete")
    if sport: query = query.filter(AthleteProfile.sport.ilike(f"%{sport}%"))
    if discipline: query = query.filter(AthleteProfile.discipline.ilike(f"%{discipline}%"))
    rows = query.limit(limit).all()
    data = []
    for user, profile in rows:
        count = db.query(PerformanceReport).filter(PerformanceReport.athlete_id == user.id).count()
        data.append({"athlete_id":user.id,"name":user.name,"sport":profile.sport,"discipline":profile.discipline,"reports_submitted":count,"rank_score":count})
    data.sort(key=lambda x: x["rank_score"], reverse=True)
    return {"success": True, "note":"This initial leaderboard is based on report submissions, not measured athletic ability. Add validated sport-specific metrics before using it for selection.", "leaderboard": [{"rank":i+1, **x} for i,x in enumerate(data)]}
