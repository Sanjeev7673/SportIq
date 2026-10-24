from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.enums import UserRole
from app.schemas.user import UserResponse
from app.schemas.event import EventOut


class SportPlayerCount(BaseModel):
    sport: str
    count: int


class UserAdminUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserStatusToggle(BaseModel):
    is_active: bool


class UserListResponse(BaseModel):
    total: int
    page: int
    limit: int
    users: List[UserResponse]


class AthleteAdminItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    player_id: Optional[int] = None
    name: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    sport: Optional[str] = "Unspecified"
    position: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = "India"
    experience: Optional[int] = 0
    is_active: bool = True
    profile_completed: bool = False
    created_at: datetime


class CoachAdminItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    name: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    organization: Optional[str] = "SportIQ Academy"
    is_active: bool = True
    recommendations_count: int = 0
    created_at: datetime


class ScoutAdminItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    name: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    organization: Optional[str] = "Independent Talent Scout"
    is_active: bool = True
    shortlists_count: int = 0
    created_at: datetime


class AdminDashboardResponse(BaseModel):
    total_users: int
    total_athletes: int
    total_coaches: int
    total_scouts: int
    total_organizers: int
    total_events: int
    published_events: int
    pending_events: int
    rejected_events: int
    upcoming_events: int
    recent_users: List[UserResponse]
    recent_event_submissions: List[EventOut]
    recent_event_approvals: List[EventOut]


class PlatformStatsResponse(BaseModel):
    total_users: int
    total_players: int
    total_performance_records: int
    total_ai_assessments: int
    users_by_role: Dict[str, int]
    players_per_sport: List[Dict[str, Any]]


class PlatformReportsResponse(BaseModel):
    total_users: int
    users_by_role: Dict[str, int]
    total_events: int
    published_events: int
    pending_events: int
    rejected_events: int
    expired_events: int
    upcoming_events: int
    total_organizers: int
    verified_organizers: int
    pending_organizers: int
    total_views: int
    athletes_per_sport: List[Dict[str, Any]]
    events_per_sport: List[Dict[str, Any]]


class PlatformSettings(BaseModel):
    platform_name: str = "SportIQ"
    platform_description: str = "AI-Driven Sports Talent Assessment & Opportunity Discovery Platform"
    default_event_visibility: str = "PUBLIC"
    event_verification_required: bool = True
    organizer_verification_required: bool = True
    default_event_expiry_behavior: str = "AUTO_EXPIRE_PAST_DATE"


class AdminNotificationItem(BaseModel):
    id: str
    title: str
    message: str
    category: str # "EVENT_SUBMISSION", "ORGANIZER_VERIFICATION", "NEW_USER"
    link: str
    created_at: datetime
    count: Optional[int] = None
