from typing import Optional
from fastapi import APIRouter, Depends, Query, status, File, UploadFile
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.player import (
    PlayerCreate,
    PlayerUpdate,
    PlayerResponse,
    PlayerDetailResponse,
    PlayerListResponse,
)
from app.schemas.common import APIResponse
from app.services.player_service import PlayerService

router = APIRouter(prefix="/players", tags=["Players"])


@router.post(
    "/profile",
    response_model=APIResponse[PlayerResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create athletic profile for current player"
)
def create_profile(
    data: PlayerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.PLAYER]))
):
    """
    Create a new athletic profile linked to the authenticated player account.
    Restricted to users with the PLAYER role.
    """
    player = PlayerService.create_player_profile(db, current_user, data)
    return APIResponse(
        success=True,
        message="Player athletic profile created successfully",
        data=player
    )


@router.get(
    "/profile/me",
    response_model=APIResponse[PlayerResponse],
    summary="Get current player's athletic profile"
)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.PLAYER]))
):
    """
    Retrieve athletic profile details of the currently logged-in player.
    """
    player = PlayerService.get_player_profile_by_user(db, current_user)
    return APIResponse(
        success=True,
        message="Athletic profile retrieved successfully",
        data=player
    )


@router.put(
    "/profile/me",
    response_model=APIResponse[PlayerResponse],
    summary="Update current player's athletic profile"
)
def update_my_profile(
    data: PlayerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.PLAYER]))
):
    """
    Update personal athletic profile details (height, weight, sport, position, achievements, etc.).
    """
    player = PlayerService.update_player_profile(db, current_user, data)
    return APIResponse(
        success=True,
        message="Athletic profile updated successfully",
        data=player
    )


@router.post(
    "/profile/photo",
    response_model=APIResponse[PlayerResponse],
    summary="Upload profile photo for current player"
)
def upload_profile_photo(
    file: UploadFile = File(..., description="Image file (.jpg, .jpeg, .png, .webp) max 5MB"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.PLAYER]))
):
    """
    Upload and save a profile image for the authenticated player.
    Saves image to disk and stores relative URL in PostgreSQL.
    """
    player = PlayerService.upload_profile_photo(db, current_user, file)
    return APIResponse(
        success=True,
        message="Profile photo uploaded successfully",
        data=player
    )


@router.delete(
    "/profile/me",
    response_model=APIResponse[dict],
    summary="Delete current player's athletic profile"
)
def delete_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.PLAYER, UserRole.ADMIN]))
):
    """
    Delete the athletic profile for the current player or by an admin.
    """
    PlayerService.delete_player_profile(db, current_user)
    return APIResponse(
        success=True,
        message="Athletic profile deleted successfully",
        data={"deleted": True}
    )


@router.get(
    "",
    response_model=APIResponse[PlayerListResponse],
    summary="Search and filter players catalog"
)
def list_players(
    sport: Optional[str] = Query(None, description="Filter by sport name"),
    position: Optional[str] = Query(None, description="Filter by position"),
    min_age: Optional[int] = Query(None, description="Filter by minimum age"),
    max_age: Optional[int] = Query(None, description="Filter by maximum age"),
    gender: Optional[str] = Query(None, description="Filter by gender"),
    search: Optional[str] = Query(None, description="Search keyword in name, sport, or achievements"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search and filter players with pagination.
    Accessible to Coaches, Scouts, Admins, and Players.
    """
    players, total = PlayerService.search_and_filter_players(
        db=db,
        sport=sport,
        position=position,
        min_age=min_age,
        max_age=max_age,
        gender=gender,
        search=search,
        page=page,
        limit=limit
    )

    return APIResponse(
        success=True,
        message="Players retrieved successfully",
        data=PlayerListResponse(
            total=total,
            page=page,
            limit=limit,
            players=players
        )
    )


@router.get(
    "/{player_id}",
    response_model=APIResponse[PlayerDetailResponse],
    summary="Get detailed player profile by ID"
)
def get_player_by_id(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch comprehensive player details by player ID, including aggregate stats and latest AI score.
    """
    player_detail = PlayerService.get_player_detail_by_id(db, player_id)
    return APIResponse(
        success=True,
        message="Player details retrieved successfully",
        data=player_detail
    )
