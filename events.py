from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user, get_optional_current_user, require_roles
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.event import (
    EventOut,
    EventListResponse,
    SavedEventOut,
    EventRecommendationCreate,
    EventRecommendationOut
)
from app.schemas.common import APIResponse
from app.services.event_service import EventService

router = APIRouter(prefix="/events", tags=["Events"])


@router.get(
    "",
    response_model=APIResponse[EventListResponse],
    summary="Discover published & verified sports events"
)
def list_events(
    sport: Optional[str] = Query(None, description="Filter by sport"),
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    competition_level: Optional[str] = Query(None, description="Filter by competition level"),
    gender: Optional[str] = Query(None, description="Filter by gender eligibility"),
    age: Optional[int] = Query(None, description="Filter by athlete age"),
    tab: str = Query("upcoming", description="Filter tab: upcoming, near_me, recommended, saved"),
    search: Optional[str] = Query(None, description="Keyword search in title, sport, venue, city, organizer"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Public and authenticated endpoint for searching verified upcoming sports events.
    Sorts by nearest upcoming date first.
    """
    # Seed default verified events if database is empty
    EventService.seed_default_events(db)

    events_data, total = EventService.list_published_events(
        db=db,
        current_user=current_user,
        sport=sport,
        city=city,
        state=state,
        event_type=event_type,
        competition_level=competition_level,
        gender=gender,
        age=age,
        tab=tab,
        search=search,
        page=page,
        limit=limit
    )

    return APIResponse(
        success=True,
        message="Events retrieved successfully",
        data=EventListResponse(
            total=total,
            page=page,
            limit=limit,
            events=[EventOut(**item) for item in events_data]
        )
    )


@router.get(
    "/saved",
    response_model=APIResponse[List[SavedEventOut]],
    summary="Get user's bookmarked events"
)
def get_saved_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all sports events bookmarked/saved by the authenticated user.
    """
    saved_items = EventService.get_user_saved_events(db, current_user)
    return APIResponse(
        success=True,
        message="Saved events retrieved successfully",
        data=[SavedEventOut(**item) for item in saved_items]
    )


@router.get(
    "/recommended",
    response_model=APIResponse[List[EventRecommendationOut]],
    summary="Get athlete's coach-recommended events"
)
def get_recommended_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.PLAYER, UserRole.ADMIN]))
):
    """
    Retrieve sports event opportunities recommended to the athlete by their coach.
    """
    recs = EventService.get_athlete_recommendations(db, current_user)
    return APIResponse(
        success=True,
        message="Coach recommended events retrieved successfully",
        data=[EventRecommendationOut(**r) for r in recs]
    )


@router.get(
    "/{event_id}",
    response_model=APIResponse[EventOut],
    summary="Get full event details"
)
def get_event_details(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Retrieve full details of a specific event and increment its view count.
    """
    event_dict = EventService.get_event_by_id(db, event_id, current_user)
    return APIResponse(
        success=True,
        message="Event details retrieved successfully",
        data=EventOut(**event_dict)
    )


@router.post(
    "/{event_id}/save",
    response_model=APIResponse[dict],
    summary="Bookmark/save an event"
)
def save_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Save/bookmark an event to the authenticated user's profile.
    """
    EventService.save_event(db, current_user, event_id)
    return APIResponse(
        success=True,
        message="Event saved to your bookmarks",
        data={"saved": True, "event_id": event_id}
    )


@router.delete(
    "/{event_id}/save",
    response_model=APIResponse[dict],
    summary="Remove saved event bookmark"
)
def unsave_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove an event from the user's bookmarks.
    """
    EventService.unsave_event(db, current_user, event_id)
    return APIResponse(
        success=True,
        message="Event removed from saved list",
        data={"saved": False, "event_id": event_id}
    )


@router.post(
    "/{event_id}/recommend",
    response_model=APIResponse[EventRecommendationOut],
    status_code=status.HTTP_201_CREATED,
    summary="Coach recommends an event to an athlete"
)
def recommend_event(
    event_id: int,
    data: EventRecommendationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.COACH, UserRole.ADMIN]))
):
    """
    Allows a coach to recommend a tournament or trial directly to a player.
    """
    rec = EventService.recommend_event_to_player(db, current_user, event_id, data)
    event_dict = EventService.get_event_by_id(db, event_id, current_user)
    return APIResponse(
        success=True,
        message="Event recommended to athlete successfully",
        data=EventRecommendationOut(
            id=rec.id,
            coach_id=rec.coach_id,
            coach_name=current_user.name,
            player_id=rec.player_id,
            event_id=rec.event_id,
            event_title=event_dict["title"],
            event_sport=event_dict["sport"],
            message=rec.message,
            status=rec.status,
            created_at=rec.created_at,
            event=EventOut(**event_dict)
        )
    )
