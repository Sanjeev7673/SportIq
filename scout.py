from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class ShortlistCreate(BaseModel):
    player_id: int = Field(..., description="Player ID to bookmark")
    notes: Optional[str] = Field(None, description="Scouting notes, observation notes, or rating comments")


class ShortlistUpdate(BaseModel):
    notes: Optional[str] = Field(None, description="Updated scouting evaluation notes")


class ShortlistResponse(BaseModel):
    id: int
    user_id: int
    player_id: int
    notes: Optional[str] = None
    player_name: str
    sport: str
    position: Optional[str] = None
    age: Optional[int] = None
    latest_talent_score: Optional[float] = None
    latest_potential_level: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ScoutPlayerItem(BaseModel):
    player_id: int
    name: str
    email: str
    sport: str
    position: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    experience: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    achievements: Optional[str] = None
    profile_image: Optional[str] = None
    latest_talent_score: Optional[float] = None
    latest_performance_score: Optional[float] = None
    latest_potential_level: Optional[str] = None
    is_shortlisted: bool = False
    shortlist_id: Optional[int] = None


class ScoutSearchResponse(BaseModel):
    total: int
    page: int
    limit: int
    players: List[ScoutPlayerItem]
