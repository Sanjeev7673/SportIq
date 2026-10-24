from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai_analysis import AIPredictionRequest, AIPredictionResponse
from app.schemas.common import APIResponse
from app.ai.prediction import AIPredictionService

router = APIRouter(prefix="/ai", tags=["AI Analytics"])


@router.post(
    "/predict",
    response_model=APIResponse[AIPredictionResponse],
    summary="Run AI talent prediction and evaluation model"
)
def predict_talent(
    request: AIPredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Execute the SportIQ AI engine over performance metrics (speed, stamina, strength, agility, accuracy, age, sport, position).
    Returns multi-factor performance score, projected talent score, potential classification, strengths, weaknesses, and training recommendations.
    """
    result = AIPredictionService.predict(data=request, db=db)
    return APIResponse(
        success=True,
        message="AI talent analysis completed successfully",
        data=result
    )


@router.get(
    "/players/{player_id}/latest",
    response_model=APIResponse[AIPredictionResponse],
    summary="Get latest AI evaluation for a player"
)
def get_latest_player_ai(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve the most recent AI talent assessment and potential rating for an athlete.
    """
    analysis = AIPredictionService.get_latest_player_analysis(db, player_id)
    return APIResponse(
        success=True,
        message="Latest AI analysis retrieved successfully",
        data=AIPredictionResponse(
            id=analysis.id,
            player_id=analysis.player_id,
            performance_id=analysis.performance_id,
            performance_score=analysis.performance_score,
            talent_score=analysis.talent_score,
            potential_level=analysis.potential_level,
            strengths=analysis.strengths,
            weaknesses=analysis.weaknesses,
            recommendations=analysis.recommendations,
            confidence_score=analysis.confidence_score,
            model_version=analysis.model_version,
            created_at=analysis.created_at
        )
    )


@router.get(
    "/players/{player_id}/history",
    response_model=APIResponse[List[AIPredictionResponse]],
    summary="Get historical timeline of AI talent assessments"
)
def get_player_ai_history(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve chronological AI talent evaluation history for trend and development tracking.
    """
    history = AIPredictionService.get_player_analysis_history(db, player_id)
    return APIResponse(
        success=True,
        message="Player AI history retrieved successfully",
        data=[
            AIPredictionResponse(
                id=a.id,
                player_id=a.player_id,
                performance_id=a.performance_id,
                performance_score=a.performance_score,
                talent_score=a.talent_score,
                potential_level=a.potential_level,
                strengths=a.strengths,
                weaknesses=a.weaknesses,
                recommendations=a.recommendations,
                confidence_score=a.confidence_score,
                model_version=a.model_version,
                created_at=a.created_at
            )
            for a in history
        ]
    )
