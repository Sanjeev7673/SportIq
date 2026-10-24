from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class TrainingRecommendationCreate(BaseModel):
    player_id: int = Field(..., description="Target Player ID")
    title: str = Field(..., min_length=3, max_length=255, description="Recommendation title")
    description: str = Field(..., min_length=5, description="Detailed training drill / workout instructions")
    focus_areas: Optional[str] = Field(None, max_length=255, description="Key focus areas (e.g., Stamina, Agility, Finishing)")
    status: Optional[str] = Field("ACTIVE", description="Recommendation status (ACTIVE, COMPLETED, ARCHIVED)")


class TrainingRecommendationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=5)
    focus_areas: Optional[str] = None
    status: Optional[str] = None


class TrainingRecommendationResponse(BaseModel):
    id: int
    coach_id: int
    player_id: int
    coach_name: Optional[str] = None
    player_name: Optional[str] = None
    title: str
    description: str
    focus_areas: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PlayerComparisonRequest(BaseModel):
    player_ids: List[int] = Field(..., min_length=2, max_length=5, description="List of 2 to 5 Player IDs to compare")


class PlayerComparisonItem(BaseModel):
    player_id: int
    name: str
    sport: str
    position: Optional[str] = None
    age: Optional[int] = None
    experience: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    avg_speed: float
    avg_stamina: float
    avg_strength: float
    avg_agility: float
    avg_accuracy: float
    latest_talent_score: Optional[float] = None
    latest_potential_level: Optional[str] = None
    total_records: int


class PlayerComparisonResponse(BaseModel):
    count: int
    comparison: List[PlayerComparisonItem]
