"""SportIQ API MVP: athlete profiles, reports, coaches, sponsors, events and bookings.

AI video analysis is intentionally represented as a clearly labelled baseline report until
a validated pose-estimation/model pipeline is connected. Do not present baseline metrics
as scientifically measured athletic performance.
"""
from __future__ import annotations

import os
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

import qrcode
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
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
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "")
if not JWT_SECRET:
    # Suitable only for local development; configure a stable secret in production.
    JWT_SECRET = secrets.token_urlsafe(48)
JWT_ALGORITHM = "HS256"
TOKEN_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))

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

class PasswordResetGrant(Base):
    __tablename__ = "password_reset_grants"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
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
    ):
        try:
            connection.exec_driver_sql(migration)
        except Exception:
            pass

app = FastAPI(title="SportIQ API", version="0.1.0", description="Athlete development and sports networking platform API")
origins = [x.strip() for x in os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,https://sportiq-theta.vercel.app").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_origin_regex=r"^https://.*\.vercel\.app$", allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

from otp_router import router as otp_router
app.include_router(otp_router, prefix="/api/v1")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": str(user.id), "role": user.role, "iat": now, "exp": now + timedelta(minutes=TOKEN_MINUTES)}, JWT_SECRET, algorithm=JWT_ALGORITHM)

def current_user(db: Session = Depends(get_db), authorization: str | None = None):
    # Dependency is overridden below with Header so FastAPI extracts the bearer token.
    raise NotImplementedError

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
    role: Literal["athlete", "coach", "sponsor"] = "athlete"

class LoginIn(BaseModel):
    email: EmailStr
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
    return {"id": u.id, "name": u.name, "email": u.email, "role": u.role, "email_verified": u.email_verified, "phone": u.phone, "phone_verified": u.phone_verified, "created_at": u.created_at.isoformat()}

@app.get("/")
def root():
    return {"name": "SportIQ API", "status": "ok", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "sportiq-api", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.post("/api/v1/auth/register", status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    email = str(payload.email).lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    if payload.phone and db.query(User).filter(User.phone == payload.phone).first():
        raise HTTPException(status_code=409, detail="An account with this phone number already exists")
    user = User(name=payload.name.strip(), email=email, phone=payload.phone, password_hash=pwd_context.hash(payload.password), role=payload.role)
    db.add(user); db.commit(); db.refresh(user)
    return {"success": True, "user": user_json(user), "verification_required": True, "message": "Account created. Verify your email with the registration OTP before logging in."}

@app.post("/api/v1/auth/login")
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == str(payload.email).lower()).first()
    if not user or not pwd_context.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.email_verified:
        raise HTTPException(status_code=403, detail="Verify your email before logging in.")
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
    if video.content_type not in allowed: raise HTTPException(status_code=415, detail="Upload an MP4, MOV, WebM or MKV video")
    ext = Path(video.filename or "upload.mp4").suffix.lower()
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
    # Honest baseline report. Replace with validated CV/pose model output in the AI integration phase.
    report = PerformanceReport(athlete_id=user.id, sport=sport.strip(), discipline=discipline.strip(), video_filename=filename, notes=notes.strip(), strengths="Video uploaded successfully. A coach can review the submitted footage.", improvements="Automated movement metrics are not yet available. Connect a validated pose-estimation pipeline to measure technique, timing and form.", analysis_status="awaiting_ai_model")
    db.add(report); db.commit(); db.refresh(report)
    return {"success": True, "report_id": report.id, "analysis_status": report.analysis_status, "uploaded_bytes": size, "message": "Video saved. This MVP does not yet run computer-vision analysis; the report clearly marks that limitation."}

@app.get("/api/v1/reports")
def list_reports(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reports = db.query(PerformanceReport).filter(PerformanceReport.athlete_id == user.id).order_by(PerformanceReport.created_at.desc()).all()
    return {"success": True, "reports": [report_json(r) for r in reports]}

def report_json(r: PerformanceReport):
    return {"id": r.id, "sport": r.sport, "discipline": r.discipline, "notes": r.notes, "strengths": r.strengths, "improvements": r.improvements, "analysis_status": r.analysis_status, "created_at": r.created_at.isoformat(), "qr_url": f"/api/v1/reports/{r.id}/qr"}

def owned_report(report_id: int, user: User, db: Session):
    r = db.get(PerformanceReport, report_id)
    if not r or (r.athlete_id != user.id and user.role != "admin"): raise HTTPException(status_code=404, detail="Report not found")
    return r

@app.get("/api/v1/reports/{report_id}")
def get_report(report_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"success": True, "report": report_json(owned_report(report_id, user, db))}

@app.get("/api/v1/reports/{report_id}/qr")
def report_qr(report_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = owned_report(report_id, user, db)
    public_base = os.getenv("PUBLIC_API_URL", "").rstrip("/")
    if not public_base: raise HTTPException(status_code=503, detail="Set PUBLIC_API_URL before generating shareable QR codes")
    # QR points to an authenticated report endpoint for now; use a separate consent-based public share token before public sharing.
    qr_path = QR_DIR / f"report_{r.id}_{user.id}.png"
    qrcode.make(f"{public_base}/api/v1/reports/{r.id}").save(qr_path)
    return FileResponse(qr_path, media_type="image/png", filename=f"sportiq-report-{r.id}-qr.png")

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
