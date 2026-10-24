import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator


class AssessmentTypeDetail(BaseModel):
    name: str
    description: str
    key_metrics: List[str]


class SportAssessmentCatalogItem(BaseModel):
    sport: str
    assessment_types: List[AssessmentTypeDetail]


class StructuredStrengthItem(BaseModel):
    name: str = Field(..., description="Strength Name")
    observation: str = Field(..., description="What the AI observed in the video")
    why_it_matters: str = Field(..., description="Why this attribute is crucial for the selected sport")
    evidence_level: str = Field("HIGH", description="HIGH, MEDIUM, LOW")


class StructuredWeaknessItem(BaseModel):
    area: str = Field(..., description="Target Area to Improve")
    observation: str = Field(..., description="What the AI observed in the video")
    why_it_matters: str = Field(..., description="Why this area limits performance")
    recommendation: str = Field(..., description="Actionable drill prescription")
    evidence_level: str = Field("HIGH", description="HIGH, MEDIUM, LOW")


class ObservableMetricItem(BaseModel):
    metric_name: str
    value: Optional[str] = None
    unit: Optional[str] = None
    is_observable: bool = True
    status_note: str = "Derived from video tracking"


class VideoAnalysisResultResponse(BaseModel):
    id: int
    overall_score: float = Field(..., description="Overall Performance Score (0-100)")
    analysis_confidence: float = Field(..., description="Video Analysis Confidence (0-100%)")
    video_quality_status: str = Field("OPTIMAL", description="OPTIMAL, SUFFICIENT, MARGINAL, INSUFFICIENT")
    video_quality_notes: Optional[str] = None
    movement_score: float = Field(..., description="Movement & Footwork Sub-Score")
    technique_score: float = Field(..., description="Execution & Technique Sub-Score")
    consistency_score: float = Field(..., description="Tempo & Consistency Sub-Score")
    detected_indicators: Optional[str] = None
    strengths: Optional[str] = None
    areas_for_improvement: Optional[str] = None
    ai_recommendations: Optional[str] = None

    structured_strengths: Optional[List[StructuredStrengthItem]] = None
    structured_weaknesses: Optional[List[StructuredWeaknessItem]] = None
    observable_metrics: Optional[List[ObservableMetricItem]] = None
    processed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("structured_strengths", mode="before")
    def parse_structured_strengths(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v

    @field_validator("structured_weaknesses", mode="before")
    def parse_structured_weaknesses(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v

    @field_validator("observable_metrics", mode="before")
    def parse_observable_metrics(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v


class VideoAssessmentResponse(BaseModel):
    id: int
    player_id: int
    player_name: Optional[str] = None
    sport: str
    assessment_type: str
    video_url: str
    original_filename: str
    file_size: int
    duration: Optional[float] = None
    notes: Optional[str] = None
    processing_status: str = "UPLOADED"

    # Verification Lifecycle State
    status: str = "UPLOADED" # UPLOADED, PROCESSING, ANALYZED, PENDING_VERIFICATION, VERIFIED, REJECTED
    verified_by: Optional[int] = None
    verified_by_name: Optional[str] = None
    verified_at: Optional[datetime] = None
    rejected_by: Optional[int] = None
    rejected_by_name: Optional[str] = None
    rejected_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    # Strict Validation Summary
    validation_status: str = "PENDING"  # PENDING, VALIDATED, REJECTED, INSUFFICIENT_EVIDENCE
    validation_reason: Optional[str] = None
    detected_sport: Optional[str] = None
    detected_activity: Optional[str] = None
    activity_confidence: float = 0.0
    video_quality_score: float = 0.0
    athlete_visibility_score: float = 0.0
    athletes_detected_count: int = 1
    camera_stability_score: float = 0.0
    lighting_quality_score: float = 0.0

    uploaded_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    analysis_result: Optional[VideoAnalysisResultResponse] = None

    model_config = ConfigDict(from_attributes=True)


class VerifyVideoAssessmentRequest(BaseModel):
    notes: Optional[str] = None


class RejectVideoAssessmentRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Reason why the coach rejected the video assessment")


class VideoAssessmentAuditResponse(BaseModel):
    id: int
    assessment_id: Optional[int] = None
    actor_user_id: Optional[int] = None
    actor_name: Optional[str] = None
    action: str
    timestamp: datetime
    details: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class VideoAssessmentListResponse(BaseModel):
    assessments: List[VideoAssessmentResponse]
    total: int
