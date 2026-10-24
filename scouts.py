from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import require_roles
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.scout import (
    ShortlistCreate,
    ShortlistUpdate,
    ShortlistResponse,
    ScoutSearchResponse
)
from app.schemas.coach import PlayerComparisonRequest, PlayerComparisonResponse
from app.schemas.performance import PerformanceHistoryResponse
from app.schemas.common import APIResponse
from app.services.scout_service import ScoutService
from app.services.coach_service import CoachService
from app.services.performance_service import PerformanceService

router = APIRouter(prefix="/scouts", tags=["Scouts"])


@router.get(
    "/search",
    response_model=APIResponse[ScoutSearchResponse],
    summary="Search talent pool with AI talent scores & bookmark status"
)
def scout_search_talent(
    sport: Optional[str] = Query(None, description="Filter by sport"),
    position: Optional[str] = Query(None, description="Filter by position"),
    min_age: Optional[int] = Query(None, description="Filter by min age"),
    max_age: Optional[int] = Query(None, description="Filter by max age"),
    min_talent_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum AI Talent Score"),
    gender: Optional[str] = Query(None, description="Filter by gender"),
    search: Optional[str] = Query(None, description="Keyword search"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SCOUT, UserRole.ADMIN]))
):
    """
    Search and filter prospective sports talent with AI talent ratings and shortlisting status.
    """
    result = ScoutService.search_talent_pool(
        db=db,
        scout_id=current_user.id,
        sport=sport,
        position=position,
        min_age=min_age,
        max_age=max_age,
        min_talent_score=min_talent_score,
        gender=gender,
        search=search,
        page=page,
        limit=limit
    )
    return APIResponse(
        success=True,
        message="Talent search completed successfully",
        data=result
    )


@router.get(
    "/players/{player_id}/performance",
    response_model=APIResponse[PerformanceHistoryResponse],
    summary="Inspect athlete's performance metrics & history"
)
def scout_view_player_performance(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SCOUT, UserRole.ADMIN]))
):
    """
    Review performance track record for a scouting target.
    """
    records = PerformanceService.get_player_performance_history(db, player_id)
    summary = PerformanceService.get_player_performance_stats(db, player_id)
    return APIResponse(
        success=True,
        message="Player scouting performance retrieved successfully",
        data=PerformanceHistoryResponse(
            player_id=player_id,
            records=[p for p in records],
            summary=summary
        )
    )


@router.post(
    "/compare",
    response_model=APIResponse[PlayerComparisonResponse],
    summary="Compare shortlisted prospects side-by-side"
)
def scout_compare_players(
    request: PlayerComparisonRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SCOUT, UserRole.ADMIN]))
):
    """
    Compare 2 to 5 scouted athletes side-by-side.
    """
    comparison = CoachService.compare_players(db, request.player_ids)
    return APIResponse(
        success=True,
        message="Scout prospect comparison matrix generated successfully",
        data=comparison
    )


@router.post(
    "/shortlist",
    response_model=APIResponse[ShortlistResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Add an athlete to your scouting shortlist"
)
def add_to_shortlist(
    data: ShortlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SCOUT, UserRole.COACH, UserRole.ADMIN]))
):
    """
    Bookmark a player with private scouting notes.
    """
    item = ScoutService.add_to_shortlist(db, current_user, data)
    return APIResponse(
        success=True,
        message="Athlete added to shortlist successfully",
        data=item
    )


@router.get(
    "/shortlist",
    response_model=APIResponse[List[ShortlistResponse]],
    summary="View all athletes in your shortlist"
)
def get_my_shortlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SCOUT, UserRole.COACH, UserRole.ADMIN]))
):
    """
    Fetch all bookmarked players with their AI talent scores and scout notes.
    """
    items = ScoutService.get_scout_shortlist(db, current_user.id)
    return APIResponse(
        success=True,
        message="Shortlist retrieved successfully",
        data=items
    )


@router.put(
    "/shortlist/{item_id}",
    response_model=APIResponse[ShortlistResponse],
    summary="Update scouting notes for a shortlisted athlete"
)
def update_shortlist_notes(
    item_id: int,
    data: ShortlistUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SCOUT, UserRole.COACH, UserRole.ADMIN]))
):
    """
    Update notes or scouting evaluation for an athlete in your shortlist.
    """
    item = ScoutService.update_shortlist_notes(db, current_user, item_id, data)
    return APIResponse(
        success=True,
        message="Shortlist notes updated successfully",
        data=item
    )


@router.delete(
    "/shortlist/{item_id}",
    response_model=APIResponse[dict],
    summary="Remove an athlete from your shortlist"
)
def remove_from_shortlist(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SCOUT, UserRole.COACH, UserRole.ADMIN]))
):
    """
    Remove an athlete from your shortlist.
    """
    ScoutService.remove_from_shortlist(db, current_user, item_id)
    return APIResponse(
        success=True,
        message="Athlete removed from shortlist successfully",
        data={"deleted": True}
    )
