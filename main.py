import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.database.session import engine
from app.database.base import Base
from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.players import router as players_router
from app.routes.performance import router as performance_router
from app.routes.coaches import router as coaches_router
from app.routes.scouts import router as scouts_router
from app.routes.admin import router as admin_router
from app.routes.ai import router as ai_router
from app.routes.video_analysis import router as video_analysis_router
from app.routes.events import router as events_router
from app.routes.organizer import router as organizer_router

# Ensure uploads directories exist
os.makedirs("uploads/profile_photos", exist_ok=True)
os.makedirs("uploads/evidence", exist_ok=True)
os.makedirs("uploads/video_assessments", exist_ok=True)

# Create database tables automatically if they do not exist
Base.metadata.create_all(bind=engine)

# Auto-migrate SQLite/PostgreSQL schema for is_active column if missing
try:
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
        conn.commit()
except Exception:
    pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

@app.on_event("startup")
def on_startup():
    from app.database.session import SessionLocal
    from app.services.admin_service import AdminService
    from app.services.event_service import EventService
    db = SessionLocal()
    try:
        AdminService.seed_dev_admin_user(db)
        EventService.seed_default_events(db)
    finally:
        db.close()

# CORS configuration supporting localhost & Vercel deployment domains
_cors_origins = list(settings.BACKEND_CORS_ORIGINS) if settings.BACKEND_CORS_ORIGINS else []
for _orig in [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://frontend-siva-8993.vercel.app",
    "https://sportiq-2.onrender.com",
]:
    if _orig not in _cors_origins:
        _cors_origins.append(_orig)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$|^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for profile uploads, evidence, and video assessments
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# Exception Handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "detail": exc.detail,
            "data": None
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        field = " -> ".join([str(loc) for loc in error.get("loc", [])])
        errors.append(f"{field}: {error.get('msg')}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Validation Error",
            "errors": errors,
            "data": None
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": f"Internal Server Error: {str(exc)}",
            "data": None
        },
    )


# Root Endpoint
@app.get("/", tags=["Root"])
def root():
    return {
        "success": True,
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": settings.PROJECT_VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }


# Include Routers
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(players_router, prefix=settings.API_V1_STR)
app.include_router(performance_router, prefix=settings.API_V1_STR)
app.include_router(coaches_router, prefix=settings.API_V1_STR)
app.include_router(scouts_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(video_analysis_router, prefix=settings.API_V1_STR)
app.include_router(events_router, prefix=settings.API_V1_STR)
app.include_router(organizer_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
