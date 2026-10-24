from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import DataSourceType, VerificationStatus


class PerformanceBase(BaseModel):
    speed: float = Field(..., ge=0, le=100, description="Speed score from 0 to 100")
    stamina: float = Field(..., ge=0, le=100, description="Stamina score from 0 to 100")
    strength: float = Field(..., ge=0, le=100, description="Strength score from 0 to 100")
    agility: float = Field(..., ge=0, le=100, description="Agility score from 0 to 100")
    accuracy: float = Field(..., ge=0, le=100, description="Accuracy score from 0 to 100")
    matches_played: int = Field(0, ge=0, description="Number of matches played")
    assessment_date: Optional[date] = Field(None, description="Date of metric assessment")
    source_type: Optional[DataSourceType] = Field(DataSourceType.STANDARDIZED_FIELD_TEST, description="Inclusive data source")
    field_test_protocol: Optional[str] = Field(None, description="Standardized protocol name (e.g. 30m Sprint, Beep Test)")
    evidence_url: Optional[str] = Field(None, description="Video / photo proof URL or upload path")


class PerformanceCreate(PerformanceBase):
    player_id: Optional[int] = Field(None, description="Target Player ID (optional for PLAYER role; required for COACH/ADMIN)")
    verification_notes: Optional[str] = Field(None, description="Optional notes on field conditions or testing setup")


class PerformanceUpdate(BaseModel):
    speed: Optional[float] = Field(None, ge=0, le=100)
    stamina: Optional[float] = Field(None, ge=0, le=100)
    strength: Optional[float] = Field(None, ge=0, le=100)
    agility: Optional[float] = Field(None, ge=0, le=100)
    accuracy: Optional[float] = Field(None, ge=0, le=100)
    matches_played: Optional[int] = Field(None, ge=0)
    assessment_date: Optional[date] = None
    source_type: Optional[DataSourceType] = None
    field_test_protocol: Optional[str] = None
    evidence_url: Optional[str] = None
    verification_notes: Optional[str] = None


class PerformanceVerificationRequest(BaseModel):
    verification_status: VerificationStatus = Field(VerificationStatus.COACH_VERIFIED, description="New verification status")
    verification_notes: Optional[str] = Field(None, description="Coach attestation / feedback notes")


class PerformanceResponse(PerformanceBase):
    id: int
    player_id: int
    assessment_date: date
    source_type: str = "STANDARDIZED_FIELD_TEST"
    verification_status: str = "UNVERIFIED"
    evidence_url: Optional[str] = None
    field_test_protocol: Optional[str] = None
    data_confidence_score: float = 65.0
    verified_by_coach_id: Optional[int] = None
    verification_notes: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PerformanceStatsSummary(BaseModel):
    player_id: int
    total_records: int
    avg_speed: float
    avg_stamina: float
    avg_strength: float
    avg_agility: float
    avg_accuracy: float
    max_speed: float
    max_stamina: float
    max_strength: float
    max_agility: float
    max_accuracy: float
    total_matches_played: int
    latest_assessment_date: Optional[date] = None
    avg_data_confidence_score: float = 65.0
    verified_records_count: int = 0


class PerformanceHistoryResponse(BaseModel):
    player_id: int
    records: List[PerformanceResponse]
    summary: Optional[PerformanceStatsSummary] = None


class EvidenceUploadResponse(BaseModel):
    evidence_url: str
    filename: str
    content_type: str
