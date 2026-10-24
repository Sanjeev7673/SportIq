from typing import List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from fastapi import HTTPException, status

from app.models.training_recommendation import TrainingRecommendation
from app.models.player import Player
from app.models.user import User
from app.models.performance import PerformanceRecord
from app.models.ai_analysis import AIAnalysis
from app.models.enums import UserRole
from app.schemas.coach import (
    TrainingRecommendationCreate,
    TrainingRecommendationUpdate,
    TrainingRecommendationResponse,
    PlayerComparisonItem,
    PlayerComparisonResponse
)


class CoachService:
    @staticmethod
    def compare_players(db: Session, player_ids: List[int]) -> PlayerComparisonResponse:
        """
        Generates a side-by-side comparison matrix across multiple players,
        aggregating their physical performance metrics and latest AI talent scores.
        """
        if len(player_ids) < 2 or len(player_ids) > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Comparison requires between 2 and 5 player IDs"
            )

        comparison_items: List[PlayerComparisonItem] = []

        for pid in player_ids:
            player = db.query(Player).options(joinedload(Player.user)).filter(Player.id == pid).first()
            if not player:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Player with ID {pid} not found for comparison"
                )

            records = db.query(PerformanceRecord).filter(PerformanceRecord.player_id == pid).all()
            total_records = len(records)

            if total_records > 0:
                avg_speed = round(sum(r.speed for r in records) / total_records, 2)
                avg_stamina = round(sum(r.stamina for r in records) / total_records, 2)
                avg_strength = round(sum(r.strength for r in records) / total_records, 2)
                avg_agility = round(sum(r.agility for r in records) / total_records, 2)
                avg_accuracy = round(sum(r.accuracy for r in records) / total_records, 2)
            else:
                avg_speed = avg_stamina = avg_strength = avg_agility = avg_accuracy = 0.0

            # Latest AI analysis
            latest_ai = (
                db.query(AIAnalysis)
                .filter(AIAnalysis.player_id == pid)
                .order_by(desc(AIAnalysis.created_at))
                .first()
            )

            item = PlayerComparisonItem(
                player_id=player.id,
                name=player.user.name if player.user else "Unknown",
                sport=player.sport,
                position=player.position,
                age=player.age,
                experience=player.experience,
                height=player.height,
                weight=player.weight,
                avg_speed=avg_speed,
                avg_stamina=avg_stamina,
                avg_strength=avg_strength,
                avg_agility=avg_agility,
                avg_accuracy=avg_accuracy,
                latest_talent_score=latest_ai.talent_score if latest_ai else None,
                latest_potential_level=latest_ai.potential_level if latest_ai else None,
                total_records=total_records
            )
            comparison_items.append(item)

        return PlayerComparisonResponse(
            count=len(comparison_items),
            comparison=comparison_items
        )

    @staticmethod
    def create_recommendation(
        db: Session,
        coach: User,
        data: TrainingRecommendationCreate
    ) -> TrainingRecommendationResponse:
        """
        Creates a new training recommendation / workout plan for an athlete.
        """
        player = db.query(Player).options(joinedload(Player.user)).filter(Player.id == data.player_id).first()
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target player with ID {data.player_id} not found"
            )

        new_rec = TrainingRecommendation(
            coach_id=coach.id,
            player_id=data.player_id,
            title=data.title.strip(),
            description=data.description.strip(),
            focus_areas=data.focus_areas.strip() if data.focus_areas else None,
            status=data.status or "ACTIVE"
        )

        db.add(new_rec)
        db.commit()
        db.refresh(new_rec)

        return TrainingRecommendationResponse(
            id=new_rec.id,
            coach_id=new_rec.coach_id,
            player_id=new_rec.player_id,
            coach_name=coach.name,
            player_name=player.user.name if player.user else "Athlete",
            title=new_rec.title,
            description=new_rec.description,
            focus_areas=new_rec.focus_areas,
            status=new_rec.status,
            created_at=new_rec.created_at,
            updated_at=new_rec.updated_at
        )

    @staticmethod
    def get_coach_recommendations(
        db: Session,
        coach_id: int
    ) -> List[TrainingRecommendationResponse]:
        """
        Retrieves all recommendations issued by a specific coach.
        """
        recs = (
            db.query(TrainingRecommendation)
            .options(
                joinedload(TrainingRecommendation.coach),
                joinedload(TrainingRecommendation.player).joinedload(Player.user)
            )
            .filter(TrainingRecommendation.coach_id == coach_id)
            .order_by(desc(TrainingRecommendation.created_at))
            .all()
        )

        return [
            TrainingRecommendationResponse(
                id=r.id,
                coach_id=r.coach_id,
                player_id=r.player_id,
                coach_name=r.coach.name if r.coach else None,
                player_name=r.player.user.name if (r.player and r.player.user) else None,
                title=r.title,
                description=r.description,
                focus_areas=r.focus_areas,
                status=r.status,
                created_at=r.created_at,
                updated_at=r.updated_at
            )
            for r in recs
        ]

    @staticmethod
    def get_player_recommendations(
        db: Session,
        player_id: int
    ) -> List[TrainingRecommendationResponse]:
        """
        Retrieves all recommendations assigned to a specific player.
        """
        recs = (
            db.query(TrainingRecommendation)
            .options(
                joinedload(TrainingRecommendation.coach),
                joinedload(TrainingRecommendation.player).joinedload(Player.user)
            )
            .filter(TrainingRecommendation.player_id == player_id)
            .order_by(desc(TrainingRecommendation.created_at))
            .all()
        )

        return [
            TrainingRecommendationResponse(
                id=r.id,
                coach_id=r.coach_id,
                player_id=r.player_id,
                coach_name=r.coach.name if r.coach else None,
                player_name=r.player.user.name if (r.player and r.player.user) else None,
                title=r.title,
                description=r.description,
                focus_areas=r.focus_areas,
                status=r.status,
                created_at=r.created_at,
                updated_at=r.updated_at
            )
            for r in recs
        ]

    @staticmethod
    def update_recommendation(
        db: Session,
        user: User,
        rec_id: int,
        data: TrainingRecommendationUpdate
    ) -> TrainingRecommendationResponse:
        """
        Updates an existing training recommendation.
        """
        rec = (
            db.query(TrainingRecommendation)
            .options(
                joinedload(TrainingRecommendation.coach),
                joinedload(TrainingRecommendation.player).joinedload(Player.user)
            )
            .filter(TrainingRecommendation.id == rec_id)
            .first()
        )
        if not rec:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Training recommendation with ID {rec_id} not found"
            )

        # Ensure user is the creator or ADMIN
        if user.role != UserRole.ADMIN and rec.coach_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this training recommendation"
            )

        update_dict = data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(rec, key, val)

        db.commit()
        db.refresh(rec)

        return TrainingRecommendationResponse(
            id=rec.id,
            coach_id=rec.coach_id,
            player_id=rec.player_id,
            coach_name=rec.coach.name if rec.coach else None,
            player_name=rec.player.user.name if (rec.player and rec.player.user) else None,
            title=rec.title,
            description=rec.description,
            focus_areas=rec.focus_areas,
            status=rec.status,
            created_at=rec.created_at,
            updated_at=rec.updated_at
        )

    @staticmethod
    def delete_recommendation(db: Session, user: User, rec_id: int) -> bool:
        """
        Deletes a training recommendation.
        """
        rec = db.query(TrainingRecommendation).filter(TrainingRecommendation.id == rec_id).first()
        if not rec:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Training recommendation with ID {rec_id} not found"
            )

        if user.role != UserRole.ADMIN and rec.coach_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this training recommendation"
            )

        db.delete(rec)
        db.commit()
        return True
