from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.user import UserResponse


class PlayerBase(BaseModel):
    sport: str = Field(..., min_length=2, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    age: Optional[int] = Field(None, ge=5, le=100)
    gender: Optional[str] = Field(None, max_length=50)
    experience: Optional[int] = Field(None, ge=0, le=50)
    height: Optional[float] = Field(None, ge=50, le=280)  # in cm
    weight: Optional[float] = Field(None, ge=20, le=300)  # in kg
    achievements: Optional[str] = None
    profile_image: Optional[str] = None


class PlayerCreate(PlayerBase):
    pass


class PlayerUpdate(BaseModel):
    sport: Optional[str] = Field(None, min_length=2, max_length=100)
    position: Optional[str] = None
    age: Optional[int] = Field(None, ge=5, le=100)
    gender: Optional[str] = None
    experience: Optional[int] = Field(None, ge=0, le=50)
    height: Optional[float] = Field(None, ge=50, le=280)
    weight: Optional[float] = Field(None, ge=20, le=300)
    achievements: Optional[str] = None
    profile_image: Optional[str] = None


class PlayerResponse(PlayerBase):
    id: int
    user_id: int
    name: Optional[str] = None
    email: Optional[str] = None
    user: Optional[UserResponse] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    performance_records_count: int = 0
    latest_performance_score: Optional[float] = None
    latest_talent_score: Optional[float] = None
    latest_potential_level: Optional[str] = None
    performance_status: Optional[str] = "Not Evaluated"

    model_config = ConfigDict(from_attributes=True)


class PlayerDetailResponse(PlayerResponse):
    pass


class PlayerListResponse(BaseModel):
    total: int
    page: int
    limit: int
    players: List[PlayerResponse]
