from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException, status

from app.ai.preprocessing import preprocess_metrics, get_feature_weights
from app.ai.model import SportIQAIModel
from app.models.ai_analysis import AIAnalysis
from app.models.player import Player
from app.models.performance import PerformanceRecord
from app.schemas.ai_analysis import AIPredictionRequest, AIPredictionResponse


class AIPredictionService:
    @staticmethod
    def predict(
        data: AIPredictionRequest,
        db: Optional[Session] = None
    ) -> AIPredictionResponse:
        """
        Execute AI preprocessing and talent prediction pipeline.
        Computes pure athletic talent rating (unbiased by device).
        If player_id and performance_id are provided with an active database session,
        persists the assessment to the ai_analysis table with its data confidence score.
        """
        # 1. Preprocess & normalize metrics
        cleaned_metrics = preprocess_metrics(
            speed=data.speed,
            stamina=data.stamina,
            strength=data.strength,
            agility=data.agility,
            accuracy=data.accuracy,
            age=data.age
        )

        # 2. Extract sport/position-specific weight matrix
        weights = get_feature_weights(
            sport=data.sport,
            position=data.position
        )

        # 3. Evaluate with SportIQ AI model (pure physical talent evaluation)
        evaluation = SportIQAIModel.evaluate(
            metrics=cleaned_metrics,
            weights=weights,
            sport=data.sport or "General",
            position=data.position or "General"
        )

        saved_id: Optional[int] = None
        saved_player_id: Optional[int] = data.player_id
        saved_perf_id: Optional[int] = data.performance_id
        saved_created_at = None
        data_confidence_val = 70.0

        # 4. Optional Persistence to PostgreSQL database
        if db is not None and data.player_id is not None and data.performance_id is not None:
            player = db.query(Player).filter(Player.id == data.player_id).first()
            perf = db.query(PerformanceRecord).filter(PerformanceRecord.id == data.performance_id).first()

            if player and perf:
                data_confidence_val = getattr(perf, "data_confidence_score", 70.0)

                ai_record = AIAnalysis(
                    player_id=data.player_id,
                    performance_id=data.performance_id,
                    performance_score=evaluation["performance_score"],
                    talent_score=evaluation["talent_score"],
                    potential_level=evaluation["potential_level"],
                    strengths=evaluation["strengths"],
                    weaknesses=evaluation["weaknesses"],
                    recommendations=evaluation["recommendations"],
                    confidence_score=evaluation["confidence_score"],
                    data_confidence_score=data_confidence_val,
                    model_version=evaluation["model_version"]
                )
                db.add(ai_record)
                db.commit()
                db.refresh(ai_record)

                saved_id = ai_record.id
                saved_created_at = ai_record.created_at

        return AIPredictionResponse(
            id=saved_id,
            player_id=saved_player_id,
            performance_id=saved_perf_id,
            performance_score=evaluation["performance_score"],
            talent_score=evaluation["talent_score"],
            potential_level=evaluation["potential_level"],
            strengths=evaluation["strengths"],
            weaknesses=evaluation["weaknesses"],
            recommendations=evaluation["recommendations"],
            confidence_score=evaluation["confidence_score"],
            data_confidence_score=data_confidence_val,
            model_version=evaluation["model_version"],
            created_at=saved_created_at
        )

    @staticmethod
    def get_latest_player_analysis(
        db: Session,
        player_id: int
    ) -> AIAnalysis:
        """
        Fetch the most recent AI talent evaluation for a player.
        """
        player = db.query(Player).filter(Player.id == player_id).first()
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Player with ID {player_id} not found"
            )

        latest_ai = (
            db.query(AIAnalysis)
            .filter(AIAnalysis.player_id == player_id)
            .order_by(desc(AIAnalysis.created_at))
            .first()
        )
        if not latest_ai:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No AI analysis found for this player. Log performance and run /ai/predict."
            )
        return latest_ai

    @staticmethod
    def get_player_analysis_history(
        db: Session,
        player_id: int
    ) -> List[AIAnalysis]:
        """
        Fetch full historical timeline of AI talent scores and potential levels for a player.
        """
        player = db.query(Player).filter(Player.id == player_id).first()
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Player with ID {player_id} not found"
            )

        return (
            db.query(AIAnalysis)
            .filter(AIAnalysis.player_id == player_id)
            .order_by(desc(AIAnalysis.created_at))
            .all()
        )
