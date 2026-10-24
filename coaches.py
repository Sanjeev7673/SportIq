from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.coach import (
    TrainingRecommendationCreate,
    TrainingRecommendationUpdate,
    TrainingRecommendationResponse,
    PlayerComparisonRequest,
    PlayerComparisonResponse
)
from app.schemas.player import PlayerListResponse, PlayerResponse
from app.schemas.performance import PerformanceHistoryResponse
from app.schemas.common import APIResponse
from app.services.coach_service import CoachService
from app.services.player_service import PlayerService
from app.services.performance_service import PerformanceService

router = APIRouter(prefix="/coaches", tags=["Coaches"])


@router.get(
    "/players",
    response_model=APIResponse[PlayerListResponse],
    summary="Search and filter players for coaches"
)
def coach_list_players(
    sport: Optional[str] = Query(None, description="Filter by sport name"),
    position: Optional[str] = Query(None, description="Filter by position"),
    min_age: Optional[int] = Query(None, description="Filter by minimum age"),
    max_age: Optional[int] = Query(None, description="Filter by maximum age"),
    gender: Optional[str] = Query(None, description="Filter by gender"),
    search: Optional[str] = Query(None, description="Search keyword in name, sport, or achievements"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.COACH, UserRole.ADMIN]))
):
    """
    Explore the squad and talent pool with advanced filters for coaches.
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
        message="Coach player catalog retrieved successfully",
        data=PlayerListResponse(
            total=total,
            page=page,
            limit=limit,
            players=players
        )
    )


@router.get(
    "/players/{player_id}/performance",
    response_model=APIResponse[PerformanceHistoryResponse],
    summary="View athlete's performance history"
)
def coach_view_player_performance(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.COACH, UserRole.ADMIN]))
):
    """
    Inspect detailed performance time-series data and summary metrics for an athlete.
    """
    records = PerformanceService.get_player_performance_history(db, player_id)
    summary = PerformanceService.get_player_performance_stats(db, player_id)
    return APIResponse(
        success=True,
        message="Player performance records retrieved successfully",
        data=PerformanceHistoryResponse(
            player_id=player_id,
            records=[p for p in records],
            summary=summary
        )
    )


@router.post(
    "/compare",
    response_model=APIResponse[PlayerComparisonResponse],
    summary="Compare 2 to 5 players side-by-side"
)
def compare_players(
    request: PlayerComparisonRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.COACH, UserRole.ADMIN]))
):
    """
    Generate side-by-side comparison matrix across physical parameters and AI talent ratings.
    """
    comparison = CoachService.compare_players(db, request.player_ids)
    return APIResponse(
        success=True,
        message="Player comparison matrix generated successfully",
        data=comparison
    )


@router.post(
    "/recommendations",
    response_model=APIResponse[TrainingRecommendationResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create training recommendation for an athlete"
)
def create_recommendation(
    data: TrainingRecommendationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.COACH, UserRole.ADMIN]))
):
    """
    Issue a new structured training recommendation or workout program for a player.
    """
    rec = CoachService.create_recommendation(db, current_user, data)
    return APIResponse(
        success=True,
        message="Training recommendation created successfully",
        data=rec
    )


@router.get(
    "/recommendations",
    response_model=APIResponse[List[TrainingRecommendationResponse]],
    summary="List recommendations created by the current coach"
)
def get_my_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.COACH, UserRole.ADMIN]))
):
    """
    Retrieve all recommendations authored by the current coach.
    """
    recs = CoachService.get_coach_recommendations(db, current_user.id)
    return APIResponse(
        success=True,
        message="Coach recommendations retrieved successfully",
        data=recs
    )


@router.get(
    "/recommendations/player/{player_id}",
    response_model=APIResponse[List[TrainingRecommendationResponse]],
    summary="List all recommendations assigned to a player"
)
def get_player_recommendations(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all coaching recommendations assigned to a specific player.
    """
    recs = CoachService.get_player_recommendations(db, player_id)
    return APIResponse(
        success=True,
        message="Player recommendations retrieved successfully",
        data=recs
    )


@router.put(
    "/recommendations/{rec_id}",
    response_model=APIResponse[TrainingRecommendationResponse],
    summary="Update a training recommendation"
)
def update_recommendation(
    rec_id: int,
    data: TrainingRecommendationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.COACH, UserRole.ADMIN]))
):
    """
    Modify title, description, focus areas, or status of an existing recommendation.
    """
    updated = CoachService.update_recommendation(db, current_user, rec_id, data)
    return APIResponse(
        success=True,
        message="Training recommendation updated successfully",
        data=updated
    )


@router.delete(
    "/recommendations/{rec_id}",
    response_model=APIResponse[dict],
    summary="Delete a training recommendation"
)
def delete_recommendation(
    rec_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.COACH, UserRole.ADMIN]))
):
    """
    Remove an existing training recommendation.
    """
    CoachService.delete_recommendation(db, current_user, rec_id)
    return APIResponse(
        success=True,
        message="Training recommendation deleted successfully",
        data={"deleted": True}
    )
