from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc
from fastapi import HTTPException, status

from app.models.shortlist import Shortlist
from app.models.player import Player
from app.models.user import User
from app.models.ai_analysis import AIAnalysis
from app.models.enums import UserRole
from app.schemas.scout import (
    ShortlistCreate,
    ShortlistUpdate,
    ShortlistResponse,
    ScoutPlayerItem,
    ScoutSearchResponse
)


class ScoutService:
    @staticmethod
    def search_talent_pool(
        db: Session,
        scout_id: int,
        sport: Optional[str] = None,
        position: Optional[str] = None,
        min_age: Optional[int] = None,
        max_age: Optional[int] = None,
        min_talent_score: Optional[float] = None,
        gender: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> ScoutSearchResponse:
        """
        Search and filter the talent database with AI talent score thresholding and shortlist bookmark status.
        """
        query = db.query(Player).join(User, Player.user_id == User.id).options(joinedload(Player.user))

        if sport:
            query = query.filter(Player.sport.ilike(f"%{sport.strip()}%"))
        if position:
            query = query.filter(Player.position.ilike(f"%{position.strip()}%"))
        if min_age is not None:
            query = query.filter(Player.age >= min_age)
        if max_age is not None:
            query = query.filter(Player.age <= max_age)
        if gender:
            query = query.filter(Player.gender.ilike(gender.strip()))
        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.name.ilike(search_pattern),
                    Player.sport.ilike(search_pattern),
                    Player.position.ilike(search_pattern),
                    Player.achievements.ilike(search_pattern)
                )
            )

        all_players = query.order_by(desc(Player.created_at)).all()

        # Fetch scout's current shortlists map for fast O(1) lookup
        scout_shortlists = db.query(Shortlist).filter(Shortlist.user_id == scout_id).all()
        shortlist_map = {s.player_id: s.id for s in scout_shortlists}

        # Process AI talent scores & filter by min_talent_score if requested
        player_items: List[ScoutPlayerItem] = []

        for p in all_players:
            latest_ai = (
                db.query(AIAnalysis)
                .filter(AIAnalysis.player_id == p.id)
                .order_by(desc(AIAnalysis.created_at))
                .first()
            )

            talent_score = latest_ai.talent_score if latest_ai else None
            performance_score = latest_ai.performance_score if latest_ai else None
            potential_level = latest_ai.potential_level if latest_ai else None

            # Apply min_talent_score filter if provided
            if min_talent_score is not None:
                if talent_score is None or talent_score < min_talent_score:
                    continue

            player_items.append(
                ScoutPlayerItem(
                    player_id=p.id,
                    name=p.user.name if p.user else "Athlete",
                    email=p.user.email if p.user else "",
                    sport=p.sport,
                    position=p.position,
                    age=p.age,
                    gender=p.gender,
                    experience=p.experience,
                    height=p.height,
                    weight=p.weight,
                    achievements=p.achievements,
                    profile_image=p.profile_image,
                    latest_talent_score=talent_score,
                    latest_performance_score=performance_score,
                    latest_potential_level=potential_level,
                    is_shortlisted=(p.id in shortlist_map),
                    shortlist_id=shortlist_map.get(p.id)
                )
            )

        total = len(player_items)
        offset = (page - 1) * limit
        paginated_items = player_items[offset : offset + limit]

        return ScoutSearchResponse(
            total=total,
            page=page,
            limit=limit,
            players=paginated_items
        )

    @staticmethod
    def add_to_shortlist(
        db: Session,
        scout: User,
        data: ShortlistCreate
    ) -> ShortlistResponse:
        """
        Bookmarks a player to the scout's shortlist with private scouting notes.
        """
        player = db.query(Player).options(joinedload(Player.user)).filter(Player.id == data.player_id).first()
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target player with ID {data.player_id} not found"
            )

        existing = db.query(Shortlist).filter(
            Shortlist.user_id == scout.id,
            Shortlist.player_id == data.player_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This athlete is already in your shortlist"
            )

        new_shortlist = Shortlist(
            user_id=scout.id,
            player_id=data.player_id,
            notes=data.notes.strip() if data.notes else None
        )
        db.add(new_shortlist)
        db.commit()
        db.refresh(new_shortlist)

        # Get latest AI score
        latest_ai = (
            db.query(AIAnalysis)
            .filter(AIAnalysis.player_id == player.id)
            .order_by(desc(AIAnalysis.created_at))
            .first()
        )

        return ShortlistResponse(
            id=new_shortlist.id,
            user_id=new_shortlist.user_id,
            player_id=new_shortlist.player_id,
            notes=new_shortlist.notes,
            player_name=player.user.name if player.user else "Athlete",
            sport=player.sport,
            position=player.position,
            age=player.age,
            latest_talent_score=latest_ai.talent_score if latest_ai else None,
            latest_potential_level=latest_ai.potential_level if latest_ai else None,
            created_at=new_shortlist.created_at
        )

    @staticmethod
    def get_scout_shortlist(
        db: Session,
        scout_id: int
    ) -> List[ShortlistResponse]:
        """
        Retrieves all shortlisted prospects for the given scout.
        """
        shortlists = (
            db.query(Shortlist)
            .options(joinedload(Shortlist.player).joinedload(Player.user))
            .filter(Shortlist.user_id == scout_id)
            .order_by(desc(Shortlist.created_at))
            .all()
        )

        responses = []
        for s in shortlists:
            latest_ai = (
                db.query(AIAnalysis)
                .filter(AIAnalysis.player_id == s.player_id)
                .order_by(desc(AIAnalysis.created_at))
                .first()
            )
            responses.append(
                ShortlistResponse(
                    id=s.id,
                    user_id=s.user_id,
                    player_id=s.player_id,
                    notes=s.notes,
                    player_name=s.player.user.name if (s.player and s.player.user) else "Athlete",
                    sport=s.player.sport if s.player else "Sport",
                    position=s.player.position if s.player else None,
                    age=s.player.age if s.player else None,
                    latest_talent_score=latest_ai.talent_score if latest_ai else None,
                    latest_potential_level=latest_ai.potential_level if latest_ai else None,
                    created_at=s.created_at
                )
            )

        return responses

    @staticmethod
    def update_shortlist_notes(
        db: Session,
        scout: User,
        item_id: int,
        data: ShortlistUpdate
    ) -> ShortlistResponse:
        """
        Updates scouting notes for a shortlisted athlete.
        """
        item = (
            db.query(Shortlist)
            .options(joinedload(Shortlist.player).joinedload(Player.user))
            .filter(Shortlist.id == item_id)
            .first()
        )
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Shortlist record with ID {item_id} not found"
            )

        if scout.role != UserRole.ADMIN and item.user_id != scout.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this shortlist entry"
            )

        item.notes = data.notes.strip() if data.notes else None
        db.commit()
        db.refresh(item)

        latest_ai = (
            db.query(AIAnalysis)
            .filter(AIAnalysis.player_id == item.player_id)
            .order_by(desc(AIAnalysis.created_at))
            .first()
        )

        return ShortlistResponse(
            id=item.id,
            user_id=item.user_id,
            player_id=item.player_id,
            notes=item.notes,
            player_name=item.player.user.name if (item.player and item.player.user) else "Athlete",
            sport=item.player.sport if item.player else "Sport",
            position=item.player.position if item.player else None,
            age=item.player.age if item.player else None,
            latest_talent_score=latest_ai.talent_score if latest_ai else None,
            latest_potential_level=latest_ai.potential_level if latest_ai else None,
            created_at=item.created_at
        )

    @staticmethod
    def remove_from_shortlist(
        db: Session,
        scout: User,
        item_id: int
    ) -> bool:
        """
        Removes an athlete from the scout's shortlist.
        """
        item = db.query(Shortlist).filter(Shortlist.id == item_id).first()
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Shortlist record with ID {item_id} not found"
            )

        if scout.role != UserRole.ADMIN and item.user_id != scout.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to remove this shortlist entry"
            )

        db.delete(item)
        db.commit()
        return True
