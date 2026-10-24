from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.event import (
    EventCreate,
    EventUpdate,
    EventOut,
    OrganizerProfileCreate,
    OrganizerProfileUpdate,
    OrganizerProfileOut
)
from app.schemas.common import APIResponse
from app.services.event_service import EventService

router = APIRouter(prefix="/organizer", tags=["Organizer Workspace"])


@router.get(
    "/profile",
    response_model=APIResponse[OrganizerProfileOut],
    summary="Get organizer profile"
)
def get_organizer_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ORGANIZER, UserRole.ADMIN]))
):
    """
    Retrieve current organizer organization details and verification status.
    """
    profile = EventService.get_or_create_organizer_profile(db, current_user)
    return APIResponse(
        success=True,
        message="Organizer profile retrieved",
        data=OrganizerProfileOut.model_validate(profile)
    )


@router.put(
    "/profile",
    response_model=APIResponse[OrganizerProfileOut],
    summary="Update organizer profile"
)
def update_organizer_profile(
    data: OrganizerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ORGANIZER, UserRole.ADMIN]))
):
    """
    Update organization credentials, contact details, and organization type.
    """
    profile = EventService.update_organizer_profile(db, current_user, data)
    return APIResponse(
        success=True,
        message="Organizer profile updated successfully",
        data=OrganizerProfileOut.model_validate(profile)
    )


@router.post(
    "/events",
    response_model=APIResponse[EventOut],
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new sports event"
)
def create_event(
    data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ORGANIZER, UserRole.ADMIN]))
):
    """
    Submit a new sports event.
    Events submitted by organizers enter PENDING_REVIEW status until approved by SportIQ Admin.
    """
    new_event = EventService.organizer_create_event(db, current_user, data)
    event_dict = EventService.get_event_by_id(db, new_event.id, current_user)
    return APIResponse(
        success=True,
        message="Your event has been submitted and is waiting for SportIQ admin verification." if new_event.status == "PENDING_REVIEW" else "Event draft saved successfully.",
        data=EventOut(**event_dict)
    )


@router.get(
    "/events",
    response_model=APIResponse[List[EventOut]],
    summary="List organizer's submitted events"
)
def list_my_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ORGANIZER, UserRole.ADMIN]))
):
    """
    List all events created by the logged-in organizer with status tracking and views count.
    """
    events = EventService.organizer_list_events(db, current_user)
    return APIResponse(
        success=True,
        message="Organizer events retrieved successfully",
        data=[EventOut(**EventService.get_event_by_id(db, e.id, current_user)) for e in events]
    )


@router.get(
    "/events/{event_id}",
    response_model=APIResponse[EventOut],
    summary="Get organizer event details"
)
def get_my_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ORGANIZER, UserRole.ADMIN]))
):
    """
    Get detailed information for an event owned by the organizer.
    """
    event = EventService.organizer_get_event(db, current_user, event_id)
    return APIResponse(
        success=True,
        message="Event retrieved successfully",
        data=EventOut(**EventService.get_event_by_id(db, event.id, current_user))
    )


@router.put(
    "/events/{event_id}",
    response_model=APIResponse[EventOut],
    summary="Update organizer event"
)
def update_my_event(
    event_id: int,
    data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ORGANIZER, UserRole.ADMIN]))
):
    """
    Edit an event. Modifying core details of a published event returns it to PENDING_REVIEW for re-verification.
    """
    updated_event = EventService.organizer_update_event(db, current_user, event_id, data)
    return APIResponse(
        success=True,
        message="Event updated successfully",
        data=EventOut(**EventService.get_event_by_id(db, updated_event.id, current_user))
    )


@router.delete(
    "/events/{event_id}",
    response_model=APIResponse[dict],
    summary="Cancel organizer event"
)
def cancel_my_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ORGANIZER, UserRole.ADMIN]))
):
    """
    Cancel an event listing.
    """
    EventService.organizer_cancel_event(db, current_user, event_id)
    return APIResponse(
        success=True,
        message="Event cancelled successfully",
        data={"cancelled": True, "event_id": event_id}
    )
