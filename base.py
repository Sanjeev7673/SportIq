# Import all models here so that Alembic and SQLAlchemy have access to them for metadata generation
from app.database.session import Base
from app.models.user import User, OTPVerification
from app.models.player import Player
from app.models.sport import Sport
from app.models.performance import PerformanceRecord
from app.models.ai_analysis import AIAnalysis
from app.models.shortlist import Shortlist
from app.models.training_recommendation import TrainingRecommendation
from app.models.video_assessment import VideoAssessment, VideoAnalysisResult, VideoAssessmentAudit
from app.models.event import Organizer, SportsEvent, SavedEvent, EventRecommendation

__all__ = [
    "Base",
    "User",
    "OTPVerification",
    "Player",
    "Sport",
    "PerformanceRecord",
    "AIAnalysis",
    "Shortlist",
    "TrainingRecommendation",
    "VideoAssessment",
    "VideoAnalysisResult",
    "VideoAssessmentAudit",
    "Organizer",
    "SportsEvent",
    "SavedEvent",
    "EventRecommendation",
]
