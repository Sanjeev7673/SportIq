from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class AIPredictionRequest(BaseModel):
    speed: float = Field(..., ge=0, le=100, description="Speed rating (0-100)")
    stamina: float = Field(..., ge=0, le=100, description="Stamina rating (0-100)")
    strength: float = Field(..., ge=0, le=100, description="Strength rating (0-100)")
    agility: float = Field(..., ge=0, le=100, description="Agility rating (0-100)")
    accuracy: float = Field(..., ge=0, le=100, description="Accuracy rating (0-100)")
    age: Optional[int] = Field(20, ge=10, le=60, description="Athlete age in years")
    sport: Optional[str] = Field("Football", description="Sport discipline")
    position: Optional[str] = Field("Forward", description="Playing position or athletic specialty")
    player_id: Optional[int] = Field(None, description="Optional Player ID for persisting analysis")
    performance_id: Optional[int] = Field(None, description="Optional Performance Record ID for linking")


class AIPredictionResponse(BaseModel):
    id: Optional[int] = None
    player_id: Optional[int] = None
    performance_id: Optional[int] = None
    performance_score: float = Field(..., description="Overall Athletic Performance Score (0-100)")
    talent_score: float = Field(..., description="Projected AI Talent Index (0-100, unbiased by device)")
    potential_level: str = Field(..., description="Classification: HIGH, MEDIUM, DEVELOPING")
    strengths: str = Field(..., description="Identified competitive strengths")
    weaknesses: str = Field(..., description="Areas for targeted developmental improvement")
    recommendations: str = Field(..., description="AI-generated workout & training recommendations")
    confidence_score: float = Field(0.85, description="Model prediction confidence level (0.0 - 1.0)")
    data_confidence_score: float = Field(70.0, description="Data Validation & Evidence Confidence Score (0 - 100%)")
    model_version: str = Field("v1.0", description="Evaluation model version")
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
