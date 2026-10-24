from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.database.session import get_db
from app.schemas.common import HealthResponse, APIResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=APIResponse[HealthResponse])
def check_health(db: Session = Depends(get_db)):
    """
    Health check endpoint: Verifies application runtime and database connectivity.
    """
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    health_data = HealthResponse(
        status="ok" if db_status == "connected" else "degraded",
        project=settings.PROJECT_NAME,
        version=settings.PROJECT_VERSION,
        environment=settings.ENVIRONMENT,
        database=db_status
    )

    return APIResponse(
        success=(db_status == "connected"),
        message="SportIQ API health status retrieved",
        data=health_data
    )
