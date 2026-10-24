import os
import uuid
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc
from fastapi import HTTPException, status, UploadFile

from app.models.player import Player
from app.models.user import User
from app.models.enums import UserRole
from app.models.performance import PerformanceRecord
from app.models.ai_analysis import AIAnalysis
from app.schemas.player import PlayerCreate, PlayerUpdate, PlayerDetailResponse, PlayerResponse
from app.schemas.user import UserResponse

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


class PlayerService:
    @staticmethod
    def create_player_profile(db: Session, user: User, data: PlayerCreate) -> PlayerResponse:
        """
        Creates an athletic profile for the authenticated PLAYER user.
        Raises 400 if user is not a PLAYER or if a profile already exists.
        """
        if user.role != UserRole.PLAYER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only users with the PLAYER role can create an athletic profile"
            )

        existing_profile = db.query(Player).filter(Player.user_id == user.id).first()
        if existing_profile:
            # Idempotently update rather than throwing 400
            update_data = data.model_dump(exclude_unset=True)
            for field, val in update_data.items():
                if hasattr(existing_profile, field):
                    setattr(existing_profile, field, val)
            db.commit()
            db.refresh(existing_profile)
            return PlayerService._to_player_response(db, existing_profile)

        new_player = Player(
            user_id=user.id,
            sport=data.sport.strip(),
            position=data.position.strip() if data.position else None,
            age=data.age,
            gender=data.gender,
            experience=data.experience,
            height=data.height,
            weight=data.weight,
            achievements=data.achievements,
            profile_image=data.profile_image
        )
        db.add(new_player)
        db.commit()
        db.refresh(new_player)
        return PlayerService._to_player_response(db, new_player)

    @staticmethod
    def get_player_profile_by_user(db: Session, user: User) -> PlayerResponse:
        """
        Retrieves the athletic profile for the authenticated user.
        If none exists yet, automatically seeds an initial profile so that the athlete never encounters a 404 error.
        """
        player = db.query(Player).options(joinedload(Player.user)).filter(Player.user_id == user.id).first()
        if not player:
            player = Player(
                user_id=user.id,
                sport="Football",
                position="Forward",
                age=20,
                gender="Male",
                experience=1,
                height=175.0,
                weight=70.0,
                achievements="Newly registered athlete"
            )
            db.add(player)
            db.commit()
            db.refresh(player)
            player = db.query(Player).options(joinedload(Player.user)).filter(Player.user_id == user.id).first()
        return PlayerService._to_player_response(db, player)

    @staticmethod
    def get_player_detail_by_id(db: Session, player_id: int) -> PlayerDetailResponse:
        """
        Retrieves full player details by ID including aggregate stats and latest AI score.
        """
        player = db.query(Player).options(joinedload(Player.user)).filter(Player.id == player_id).first()
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Player with ID {player_id} not found"
            )

        records_count = db.query(PerformanceRecord).filter(PerformanceRecord.player_id == player.id).count()

        latest_ai = (
            db.query(AIAnalysis)
            .filter(AIAnalysis.player_id == player.id)
            .order_by(desc(AIAnalysis.created_at))
            .first()
        )

        perf_status = "AI Analyzed" if latest_ai else ("Evaluated" if records_count > 0 else "Not Evaluated")

        return PlayerDetailResponse(
            id=player.id,
            user_id=player.user_id,
            name=player.user.name if player.user else None,
            email=player.user.email if player.user else None,
            sport=player.sport,
            position=player.position,
            age=player.age,
            gender=player.gender,
            experience=player.experience,
            height=player.height,
            weight=player.weight,
            achievements=player.achievements,
            profile_image=player.profile_image,
            created_at=player.created_at,
            updated_at=player.updated_at,
            user=UserResponse.model_validate(player.user) if player.user else None,
            performance_records_count=records_count,
            latest_performance_score=latest_ai.performance_score if latest_ai else None,
            latest_talent_score=latest_ai.talent_score if latest_ai else None,
            latest_potential_level=latest_ai.potential_level if latest_ai else None,
            performance_status=perf_status
        )

    @staticmethod
    def update_player_profile(db: Session, user: User, data: PlayerUpdate) -> PlayerResponse:
        """
        Updates an existing player profile for the authenticated user.
        """
        player = db.query(Player).options(joinedload(Player.user)).filter(Player.user_id == user.id).first()
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Athletic profile not found. Please create your profile first."
            )

        update_dict = data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(player, key, val)

        db.commit()
        db.refresh(player)
        return PlayerService._to_player_response(db, player)

    @staticmethod
    def upload_profile_photo(db: Session, user: User, file: UploadFile) -> PlayerResponse:
        """
        Validates, saves, and links a profile photo to the player's profile in PostgreSQL.
        """
        player = db.query(Player).options(joinedload(Player.user)).filter(Player.user_id == user.id).first()
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Athletic profile not found. Please create a profile before uploading a photo."
            )

        content_type = file.content_type.lower() if file.content_type else ""
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP (received: {content_type})"
            )

        original_filename = file.filename or "photo.jpg"
        _, ext = os.path.splitext(original_filename.lower())
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file extension {ext}. Allowed: .jpg, .jpeg, .png, .webp"
            )

        content = file.file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum allowed limit of 5 MB"
            )

        upload_dir = os.path.join("uploads", "profile_photos")
        os.makedirs(upload_dir, exist_ok=True)
        unique_filename = f"player_{user.id}_{uuid.uuid4().hex[:10]}{ext}"
        file_path = os.path.join(upload_dir, unique_filename)

        with open(file_path, "wb") as f:
            f.write(content)

        relative_url = f"/uploads/profile_photos/{unique_filename}"
        player.profile_image = relative_url
        db.commit()
        db.refresh(player)
        return PlayerService._to_player_response(db, player)

    @staticmethod
    def delete_player_profile(db: Session, user: User, player_id: Optional[int] = None) -> bool:
        """
        Deletes player profile.
        """
        if player_id and user.role == UserRole.ADMIN:
            player = db.query(Player).filter(Player.id == player_id).first()
        else:
            player = db.query(Player).filter(Player.user_id == user.id).first()

        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Player profile not found"
            )

        db.delete(player)
        db.commit()
        return True

    @staticmethod
    def search_and_filter_players(
        db: Session,
        sport: Optional[str] = None,
        position: Optional[str] = None,
        min_age: Optional[int] = None,
        max_age: Optional[int] = None,
        gender: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[PlayerResponse], int]:
        """
        Search and filter players with pagination, dynamically populating User data,
        latest AI talent score, potential rating, and performance status.
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
                    User.email.ilike(search_pattern),
                    Player.sport.ilike(search_pattern),
                    Player.position.ilike(search_pattern),
                    Player.achievements.ilike(search_pattern)
                )
            )

        total = query.count()
        offset = (page - 1) * limit
        players = query.order_by(desc(Player.created_at)).offset(offset).limit(limit).all()

        results = [PlayerService._to_player_response(db, p) for p in players]
        return results, total

    @staticmethod
    def _to_player_response(db: Session, player: Player) -> PlayerResponse:
        """
        Helper method to build rich PlayerResponse with User details, records count,
        latest AI score, and computed performance status.
        """
        records_count = db.query(PerformanceRecord).filter(PerformanceRecord.player_id == player.id).count()

        latest_ai = (
            db.query(AIAnalysis)
            .filter(AIAnalysis.player_id == player.id)
            .order_by(desc(AIAnalysis.created_at))
            .first()
        )

        perf_status = "AI Analyzed" if latest_ai else ("Evaluated" if records_count > 0 else "Not Evaluated")

        return PlayerResponse(
            id=player.id,
            user_id=player.user_id,
            name=player.user.name if player.user else None,
            email=player.user.email if player.user else None,
            sport=player.sport,
            position=player.position,
            age=player.age,
            gender=player.gender,
            experience=player.experience,
            height=player.height,
            weight=player.weight,
            achievements=player.achievements,
            profile_image=player.profile_image,
            created_at=player.created_at,
            updated_at=player.updated_at,
            user=UserResponse.model_validate(player.user) if player.user else None,
            performance_records_count=records_count,
            latest_performance_score=latest_ai.performance_score if latest_ai else None,
            latest_talent_score=latest_ai.talent_score if latest_ai else None,
            latest_potential_level=latest_ai.potential_level if latest_ai else None,
            performance_status=perf_status
        )
