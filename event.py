from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


# -------------------------------------------------------------
# Organizer Schemas
# -------------------------------------------------------------
class OrganizerProfileBase(BaseModel):
    organization_name: str
    contact_person: str
    email: str
    phone: str
    organization_type: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None


class OrganizerProfileCreate(OrganizerProfileBase):
    pass


class OrganizerProfileUpdate(BaseModel):
    organization_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    organization_type: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None


class OrganizerProfileOut(OrganizerProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    verification_status: str
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class OrganizerAdminVerify(BaseModel):
    status: str # "VERIFIED" or "REJECTED"
    rejection_reason: Optional[str] = None


# -------------------------------------------------------------
# Event Schemas
# -------------------------------------------------------------
class EventBase(BaseModel):
    title: str
    sport: str
    event_type: str = "Tournament"
    description: str
    start_date: date
    end_date: date
    registration_deadline: date
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    venue: str
    city: str
    state: str
    country: str = "India"
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    gender: str = "All"
    competition_level: str = "Open"
    entry_fee: Optional[str] = None
    prize_details: Optional[str] = None
    eligibility: Optional[str] = None
    organizer_name: str
    contact_email: str
    contact_phone: str
    registration_url: Optional[str] = None
    source_url: Optional[str] = None
    poster_url: Optional[str] = None


class EventCreate(EventBase):
    save_as_draft: bool = False


class EventUpdate(BaseModel):
    title: Optional[str] = None
    sport: Optional[str] = None
    event_type: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    registration_deadline: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    gender: Optional[str] = None
    competition_level: Optional[str] = None
    entry_fee: Optional[str] = None
    prize_details: Optional[str] = None
    eligibility: Optional[str] = None
    organizer_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    registration_url: Optional[str] = None
    source_url: Optional[str] = None
    poster_url: Optional[str] = None
    status: Optional[str] = None # For admin or organizer draft/cancel


class EventAdminReview(BaseModel):
    action: str # "APPROVE", "REJECT", "REQUEST_CHANGES"
    admin_notes: Optional[str] = None


class EventOut(EventBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organizer_id: Optional[int] = None
    created_by_user_id: Optional[int] = None
    status: str
    verification_status: str
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None
    admin_notes: Optional[str] = None
    views_count: int = 0
    is_saved: Optional[bool] = False
    is_recommended: Optional[bool] = False
    recommendation_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class EventListResponse(BaseModel):
    total: int
    page: int
    limit: int
    events: List[EventOut]


# -------------------------------------------------------------
# Saved Events & Recommendations
# -------------------------------------------------------------
class SavedEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    event_id: int
    created_at: datetime
    event: Optional[EventOut] = None


class EventRecommendationCreate(BaseModel):
    player_id: int
    message: Optional[str] = None


class EventRecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    coach_id: int
    coach_name: Optional[str] = None
    player_id: int
    player_name: Optional[str] = None
    event_id: int
    event_title: Optional[str] = None
    event_sport: Optional[str] = None
    message: Optional[str] = None
    status: str
    created_at: datetime
    event: Optional[EventOut] = None


# -------------------------------------------------------------
# Admin Stats Schema
# -------------------------------------------------------------
class AdminEventStatsResponse(BaseModel):
    total_events: int
    published_events: int
    pending_events: int
    rejected_events: int
    upcoming_events: int
    expired_events: int
    total_organizers: int
    verified_organizers: int
    pending_organizers: int
    total_saved_events: int
    total_views: int
    recent_submissions: List[EventOut]
