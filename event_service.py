import datetime
from datetime import date, datetime, timezone, timedelta
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc, asc, func
from fastapi import HTTPException, status

from app.models.event import Organizer, SportsEvent, SavedEvent, EventRecommendation
from app.models.user import User
from app.models.player import Player
from app.models.enums import UserRole
from app.schemas.event import (
    EventCreate,
    EventUpdate,
    EventAdminReview,
    OrganizerProfileCreate,
    OrganizerProfileUpdate,
    EventRecommendationCreate,
    OrganizerAdminVerify,
)


class EventService:
    # -------------------------------------------------------------
    # Public & Authenticated Event Discovery
    # -------------------------------------------------------------
    @staticmethod
    def list_published_events(
        db: Session,
        current_user: Optional[User] = None,
        sport: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        event_type: Optional[str] = None,
        competition_level: Optional[str] = None,
        gender: Optional[str] = None,
        age: Optional[int] = None,
        tab: str = "upcoming", # "upcoming", "near_me", "recommended", "saved"
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Queries verified, published sports events with server-side SQL filtering and pagination.
        Only returns active upcoming events (or saved/recommended events).
        """
        today = date.today()

        # Update any events past end date to EXPIRED
        db.query(SportsEvent).filter(
            SportsEvent.status == "PUBLISHED",
            SportsEvent.end_date < today
        ).update({"status": "EXPIRED"}, synchronize_session=False)
        db.commit()

        # Base query for published + verified events
        query = db.query(SportsEvent).filter(
            SportsEvent.status == "PUBLISHED",
            SportsEvent.verification_status == "VERIFIED"
        )

        # Tab specific filtering
        if tab == "upcoming":
            query = query.filter(SportsEvent.end_date >= today)
        elif tab == "near_me":
            query = query.filter(SportsEvent.end_date >= today)
            if city:
                query = query.filter(func.lower(SportsEvent.city) == city.strip().lower())
            if state:
                query = query.filter(func.lower(SportsEvent.state) == state.strip().lower())
        elif tab == "recommended" and current_user and current_user.role == UserRole.PLAYER:
            query = query.filter(SportsEvent.end_date >= today)
            player = db.query(Player).filter(Player.user_id == current_user.id).first()
            if player:
                if player.sport:
                    query = query.filter(func.lower(SportsEvent.sport) == player.sport.strip().lower())
                if player.age:
                    query = query.filter(
                        or_(
                            and_(SportsEvent.age_min <= player.age, SportsEvent.age_max >= player.age),
                            and_(SportsEvent.age_min.is_(None), SportsEvent.age_max >= player.age),
                            and_(SportsEvent.age_min <= player.age, SportsEvent.age_max.is_(None)),
                            and_(SportsEvent.age_min.is_(None), SportsEvent.age_max.is_(None))
                        )
                    )
        elif tab == "saved" and current_user:
            saved_event_ids = [s.event_id for s in db.query(SavedEvent.event_id).filter(SavedEvent.user_id == current_user.id).all()]
            query = query.filter(SportsEvent.id.in_(saved_event_ids))

        # Standard Filters
        if sport:
            query = query.filter(func.lower(SportsEvent.sport) == sport.strip().lower())
        if city and tab != "near_me":
            query = query.filter(func.lower(SportsEvent.city) == city.strip().lower())
        if state and tab != "near_me":
            query = query.filter(func.lower(SportsEvent.state) == state.strip().lower())
        if event_type:
            query = query.filter(func.lower(SportsEvent.event_type) == event_type.strip().lower())
        if competition_level:
            query = query.filter(func.lower(SportsEvent.competition_level) == competition_level.strip().lower())
        if gender and gender.lower() != "all":
            query = query.filter(
                or_(
                    func.lower(SportsEvent.gender) == gender.strip().lower(),
                    func.lower(SportsEvent.gender) == "all"
                )
            )
        if age is not None:
            query = query.filter(
                or_(
                    and_(SportsEvent.age_min <= age, SportsEvent.age_max >= age),
                    and_(SportsEvent.age_min.is_(None), SportsEvent.age_max >= age),
                    and_(SportsEvent.age_min <= age, SportsEvent.age_max.is_(None)),
                    and_(SportsEvent.age_min.is_(None), SportsEvent.age_max.is_(None))
                )
            )

        # Keyword search across title, sport, organizer, city, venue
        if search:
            search_pattern = f"%{search.strip().lower()}%"
            query = query.filter(
                or_(
                    func.lower(SportsEvent.title).like(search_pattern),
                    func.lower(SportsEvent.sport).like(search_pattern),
                    func.lower(SportsEvent.organizer_name).like(search_pattern),
                    func.lower(SportsEvent.city).like(search_pattern),
                    func.lower(SportsEvent.venue).like(search_pattern),
                    func.lower(SportsEvent.description).like(search_pattern)
                )
            )

        # Total count
        total = query.count()

        # Sort nearest upcoming first
        query = query.order_by(asc(SportsEvent.start_date), asc(SportsEvent.registration_deadline))

        # Paginate
        offset = (page - 1) * limit
        events = query.offset(offset).limit(limit).all()

        # Augment with user saved status and coach recommendation info
        user_saved_ids = set()
        if current_user:
            user_saved_ids = set(
                row[0] for row in db.query(SavedEvent.event_id).filter(SavedEvent.user_id == current_user.id).all()
            )

        result_items = []
        for e in events:
            item_dict = {
                "id": e.id,
                "title": e.title,
                "sport": e.sport,
                "event_type": e.event_type,
                "description": e.description,
                "start_date": e.start_date,
                "end_date": e.end_date,
                "registration_deadline": e.registration_deadline,
                "start_time": e.start_time,
                "end_time": e.end_time,
                "venue": e.venue,
                "city": e.city,
                "state": e.state,
                "country": e.country,
                "age_min": e.age_min,
                "age_max": e.age_max,
                "gender": e.gender,
                "competition_level": e.competition_level,
                "entry_fee": e.entry_fee,
                "prize_details": e.prize_details,
                "eligibility": e.eligibility,
                "organizer_id": e.organizer_id,
                "created_by_user_id": e.created_by_user_id,
                "organizer_name": e.organizer_name,
                "contact_email": e.contact_email,
                "contact_phone": e.contact_phone,
                "registration_url": e.registration_url,
                "source_url": e.source_url,
                "poster_url": e.poster_url,
                "status": e.status,
                "verification_status": e.verification_status,
                "verified_by": e.verified_by,
                "verified_at": e.verified_at,
                "admin_notes": e.admin_notes,
                "views_count": e.views_count,
                "is_saved": e.id in user_saved_ids,
                "is_recommended": False,
                "recommendation_message": None,
                "created_at": e.created_at,
                "updated_at": e.updated_at
            }
            result_items.append(item_dict)

        return result_items, total

    @staticmethod
    def get_event_by_id(db: Session, event_id: int, current_user: Optional[User] = None) -> Dict[str, Any]:
        """
        Retrieves full event details and increments view count.
        """
        event = db.query(SportsEvent).filter(SportsEvent.id == event_id).first()
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sports event with ID {event_id} not found"
            )

        # Increment view count
        event.views_count += 1
        db.commit()
        db.refresh(event)

        # Check saved state
        is_saved = False
        is_recommended = False
        rec_message = None

        if current_user:
            is_saved = db.query(SavedEvent).filter(
                SavedEvent.user_id == current_user.id,
                SavedEvent.event_id == event_id
            ).first() is not None

            if current_user.role == UserRole.PLAYER:
                player = db.query(Player).filter(Player.user_id == current_user.id).first()
                if player:
                    rec = db.query(EventRecommendation).filter(
                        EventRecommendation.player_id == player.id,
                        EventRecommendation.event_id == event_id
                    ).first()
                    if rec:
                        is_recommended = True
                        rec_message = rec.message

        return {
            "id": event.id,
            "title": event.title,
            "sport": event.sport,
            "event_type": event.event_type,
            "description": event.description,
            "start_date": event.start_date,
            "end_date": event.end_date,
            "registration_deadline": event.registration_deadline,
            "start_time": event.start_time,
            "end_time": event.end_time,
            "venue": event.venue,
            "city": event.city,
            "state": event.state,
            "country": event.country,
            "age_min": event.age_min,
            "age_max": event.age_max,
            "gender": event.gender,
            "competition_level": event.competition_level,
            "entry_fee": event.entry_fee,
            "prize_details": event.prize_details,
            "eligibility": event.eligibility,
            "organizer_id": event.organizer_id,
            "created_by_user_id": event.created_by_user_id,
            "organizer_name": event.organizer_name,
            "contact_email": event.contact_email,
            "contact_phone": event.contact_phone,
            "registration_url": event.registration_url,
            "source_url": event.source_url,
            "poster_url": event.poster_url,
            "status": event.status,
            "verification_status": event.verification_status,
            "verified_by": event.verified_by,
            "verified_at": event.verified_at,
            "admin_notes": event.admin_notes,
            "views_count": event.views_count,
            "is_saved": is_saved,
            "is_recommended": is_recommended,
            "recommendation_message": rec_message,
            "created_at": event.created_at,
            "updated_at": event.updated_at
        }

    # -------------------------------------------------------------
    # Bookmarks / Saved Events
    # -------------------------------------------------------------
    @staticmethod
    def save_event(db: Session, user: User, event_id: int) -> bool:
        event = db.query(SportsEvent).filter(SportsEvent.id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        existing = db.query(SavedEvent).filter(
            SavedEvent.user_id == user.id,
            SavedEvent.event_id == event_id
        ).first()

        if not existing:
            saved = SavedEvent(user_id=user.id, event_id=event_id)
            db.add(saved)
            db.commit()

        return True

    @staticmethod
    def unsave_event(db: Session, user: User, event_id: int) -> bool:
        saved = db.query(SavedEvent).filter(
            SavedEvent.user_id == user.id,
            SavedEvent.event_id == event_id
        ).first()

        if saved:
            db.delete(saved)
            db.commit()

        return True

    @staticmethod
    def get_user_saved_events(db: Session, user: User) -> List[Dict[str, Any]]:
        saved_items = db.query(SavedEvent).options(
            joinedload(SavedEvent.event)
        ).filter(SavedEvent.user_id == user.id).order_by(desc(SavedEvent.created_at)).all()

        results = []
        for s in saved_items:
            if s.event:
                item = EventService.get_event_by_id(db, s.event.id, user)
                results.append({
                    "id": s.id,
                    "user_id": s.user_id,
                    "event_id": s.event_id,
                    "created_at": s.created_at,
                    "event": item
                })
        return results

    # -------------------------------------------------------------
    # Coach Recommendations
    # -------------------------------------------------------------
    @staticmethod
    def recommend_event_to_player(
        db: Session,
        coach: User,
        event_id: int,
        data: EventRecommendationCreate
    ) -> EventRecommendation:
        if coach.role not in [UserRole.COACH, UserRole.ADMIN]:
            raise HTTPException(status_code=403, detail="Only coaches or admins can recommend events")

        event = db.query(SportsEvent).filter(SportsEvent.id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        player = db.query(Player).options(joinedload(Player.user)).filter(Player.id == data.player_id).first()
        if not player:
            raise HTTPException(status_code=404, detail="Athlete not found")

        rec = EventRecommendation(
            coach_id=coach.id,
            player_id=data.player_id,
            event_id=event_id,
            message=data.message.strip() if data.message else f"Recommended for your {player.sport} competition calendar.",
            status="SENT"
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return rec

    @staticmethod
    def get_athlete_recommendations(db: Session, user: User) -> List[Dict[str, Any]]:
        player = db.query(Player).filter(Player.user_id == user.id).first()
        if not player:
            return []

        recs = db.query(EventRecommendation).options(
            joinedload(EventRecommendation.coach),
            joinedload(EventRecommendation.event)
        ).filter(EventRecommendation.player_id == player.id).order_by(desc(EventRecommendation.created_at)).all()

        results = []
        for r in recs:
            if r.event:
                event_dict = EventService.get_event_by_id(db, r.event.id, user)
                results.append({
                    "id": r.id,
                    "coach_id": r.coach_id,
                    "coach_name": r.coach.name if r.coach else "Coach",
                    "player_id": r.player_id,
                    "player_name": user.name,
                    "event_id": r.event_id,
                    "event_title": r.event.title,
                    "event_sport": r.event.sport,
                    "message": r.message,
                    "status": r.status,
                    "created_at": r.created_at,
                    "event": event_dict
                })
        return results

    # -------------------------------------------------------------
    # Organizer Operations
    # -------------------------------------------------------------
    @staticmethod
    def get_or_create_organizer_profile(db: Session, user: User, data: Optional[OrganizerProfileCreate] = None) -> Organizer:
        profile = db.query(Organizer).filter(Organizer.user_id == user.id).first()
        if not profile:
            if not data:
                profile = Organizer(
                    user_id=user.id,
                    organization_name=user.name + " Sports Organization",
                    contact_person=user.name,
                    email=user.email or "organizer@sportiq.ai",
                    phone=user.phone_number or "9876543210",
                    organization_type="Sports Academy / Association",
                    verification_status="PENDING"
                )
            else:
                profile = Organizer(
                    user_id=user.id,
                    organization_name=data.organization_name.strip(),
                    contact_person=data.contact_person.strip(),
                    email=data.email.strip(),
                    phone=data.phone.strip(),
                    organization_type=data.organization_type.strip() if data.organization_type else None,
                    website=data.website.strip() if data.website else None,
                    description=data.description.strip() if data.description else None,
                    verification_status="PENDING"
                )
            db.add(profile)
            db.commit()
            db.refresh(profile)
        return profile

    @staticmethod
    def update_organizer_profile(db: Session, user: User, data: OrganizerProfileUpdate) -> Organizer:
        profile = EventService.get_or_create_organizer_profile(db, user)
        update_data = data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            if v is not None:
                setattr(profile, k, v)
        db.commit()
        db.refresh(profile)
        return profile

    @staticmethod
    def organizer_create_event(db: Session, user: User, data: EventCreate) -> SportsEvent:
        if user.role != UserRole.ORGANIZER and user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Only registered organizers can create event listings")

        organizer = EventService.get_or_create_organizer_profile(db, user)

        # Verification check: only verified organizers can submit for review
        is_admin = (user.role == UserRole.ADMIN)
        if not is_admin and organizer.verification_status != "VERIFIED" and not data.save_as_draft:
            # Allow submission into PENDING_REVIEW if organizer profile exists, but warn/require profile
            pass

        status_val = "DRAFT" if data.save_as_draft else "PENDING_REVIEW"
        verif_status = "UNVERIFIED" if data.save_as_draft else "PENDING"

        new_event = SportsEvent(
            title=data.title.strip(),
            sport=data.sport.strip(),
            event_type=data.event_type.strip(),
            description=data.description.strip(),
            start_date=data.start_date,
            end_date=data.end_date,
            registration_deadline=data.registration_deadline,
            start_time=data.start_time.strip() if data.start_time else None,
            end_time=data.end_time.strip() if data.end_time else None,
            venue=data.venue.strip(),
            city=data.city.strip(),
            state=data.state.strip(),
            country=data.country.strip() or "India",
            age_min=data.age_min,
            age_max=data.age_max,
            gender=data.gender.strip() or "All",
            competition_level=data.competition_level.strip() or "Open",
            entry_fee=data.entry_fee.strip() if data.entry_fee else None,
            prize_details=data.prize_details.strip() if data.prize_details else None,
            eligibility=data.eligibility.strip() if data.eligibility else None,
            organizer_id=organizer.id,
            created_by_user_id=user.id,
            organizer_name=data.organizer_name.strip() or organizer.organization_name,
            contact_email=data.contact_email.strip() or organizer.email,
            contact_phone=data.contact_phone.strip() or organizer.phone,
            registration_url=data.registration_url.strip() if data.registration_url else None,
            source_url=data.source_url.strip() if data.source_url else None,
            poster_url=data.poster_url.strip() if data.poster_url else None,
            status=status_val,
            verification_status=verif_status
        )

        db.add(new_event)
        db.commit()
        db.refresh(new_event)
        return new_event

    @staticmethod
    def organizer_list_events(db: Session, user: User) -> List[SportsEvent]:
        organizer = EventService.get_or_create_organizer_profile(db, user)
        return db.query(SportsEvent).filter(
            or_(
                SportsEvent.organizer_id == organizer.id,
                SportsEvent.created_by_user_id == user.id
            )
        ).order_by(desc(SportsEvent.created_at)).all()

    @staticmethod
    def organizer_get_event(db: Session, user: User, event_id: int) -> SportsEvent:
        event = db.query(SportsEvent).filter(SportsEvent.id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        organizer = db.query(Organizer).filter(Organizer.user_id == user.id).first()
        if user.role != UserRole.ADMIN and (not organizer or (event.organizer_id != organizer.id and event.created_by_user_id != user.id)):
            raise HTTPException(status_code=403, detail="You do not have permission to access this event")

        return event

    @staticmethod
    def organizer_update_event(db: Session, user: User, event_id: int, data: EventUpdate) -> SportsEvent:
        event = EventService.organizer_get_event(db, user, event_id)

        update_data = data.model_dump(exclude_unset=True)

        # If a published event has core fields modified, revert to PENDING_REVIEW
        core_fields = {"start_date", "end_date", "registration_deadline", "venue", "city", "state", "registration_url", "eligibility", "age_min", "age_max"}
        has_core_changes = any(k in core_fields for k in update_data.keys())

        if user.role != UserRole.ADMIN and event.status == "PUBLISHED" and has_core_changes:
            event.status = "PENDING_REVIEW"
            event.verification_status = "PENDING"
            event.admin_notes = "Event updated by organizer. Pending admin re-verification."

        for k, v in update_data.items():
            if v is not None:
                setattr(event, k, v)

        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def organizer_cancel_event(db: Session, user: User, event_id: int) -> SportsEvent:
        event = EventService.organizer_get_event(db, user, event_id)
        event.status = "CANCELLED"
        db.commit()
        db.refresh(event)
        return event

    # -------------------------------------------------------------
    # Admin Operations
    # -------------------------------------------------------------
    @staticmethod
    def admin_create_event(db: Session, admin: User, data: EventCreate) -> SportsEvent:
        if admin.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Admin permission required")

        status_val = "DRAFT" if data.save_as_draft else "PUBLISHED"
        verif_status = "UNVERIFIED" if data.save_as_draft else "VERIFIED"

        new_event = SportsEvent(
            title=data.title.strip(),
            sport=data.sport.strip(),
            event_type=data.event_type.strip(),
            description=data.description.strip(),
            start_date=data.start_date,
            end_date=data.end_date,
            registration_deadline=data.registration_deadline,
            start_time=data.start_time.strip() if data.start_time else None,
            end_time=data.end_time.strip() if data.end_time else None,
            venue=data.venue.strip(),
            city=data.city.strip(),
            state=data.state.strip(),
            country=data.country.strip() or "India",
            age_min=data.age_min,
            age_max=data.age_max,
            gender=data.gender.strip() or "All",
            competition_level=data.competition_level.strip() or "Open",
            entry_fee=data.entry_fee.strip() if data.entry_fee else None,
            prize_details=data.prize_details.strip() if data.prize_details else None,
            eligibility=data.eligibility.strip() if data.eligibility else None,
            organizer_id=None,
            created_by_user_id=admin.id,
            organizer_name=data.organizer_name.strip(),
            contact_email=data.contact_email.strip(),
            contact_phone=data.contact_phone.strip(),
            registration_url=data.registration_url.strip() if data.registration_url else None,
            source_url=data.source_url.strip() if data.source_url else None,
            poster_url=data.poster_url.strip() if data.poster_url else None,
            status=status_val,
            verification_status=verif_status,
            verified_by=admin.id if status_val == "PUBLISHED" else None,
            verified_at=datetime.now(timezone.utc) if status_val == "PUBLISHED" else None
        )

        db.add(new_event)
        db.commit()
        db.refresh(new_event)
        return new_event

    @staticmethod
    def admin_list_all_events(
        db: Session,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 50
    ) -> Tuple[List[SportsEvent], int]:
        query = db.query(SportsEvent)
        if status_filter:
            query = query.filter(SportsEvent.status == status_filter)
        if search:
            search_pattern = f"%{search.strip().lower()}%"
            query = query.filter(
                or_(
                    func.lower(SportsEvent.title).like(search_pattern),
                    func.lower(SportsEvent.sport).like(search_pattern),
                    func.lower(SportsEvent.organizer_name).like(search_pattern),
                    func.lower(SportsEvent.city).like(search_pattern)
                )
            )

        total = query.count()
        events = query.order_by(desc(SportsEvent.created_at)).offset((page - 1) * limit).limit(limit).all()
        return events, total

    @staticmethod
    def admin_list_pending_events(db: Session) -> List[SportsEvent]:
        return db.query(SportsEvent).filter(
            SportsEvent.status == "PENDING_REVIEW"
        ).order_by(asc(SportsEvent.created_at)).all()

    @staticmethod
    def admin_review_event(db: Session, admin: User, event_id: int, review: EventAdminReview) -> SportsEvent:
        if admin.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Admin authorization required")

        event = db.query(SportsEvent).filter(SportsEvent.id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        action = review.action.upper()
        if action == "APPROVE":
            event.status = "PUBLISHED"
            event.verification_status = "VERIFIED"
            event.verified_by = admin.id
            event.verified_at = datetime.now(timezone.utc)
            event.admin_notes = review.admin_notes or "Verified and approved by SportIQ Administrator."
        elif action == "REJECT":
            event.status = "REJECTED"
            event.verification_status = "REJECTED"
            event.admin_notes = review.admin_notes or "Event submission did not meet verification criteria."
        elif action == "REQUEST_CHANGES":
            event.status = "CHANGES_REQUESTED"
            event.verification_status = "PENDING"
            event.admin_notes = review.admin_notes or "Please update event details and re-submit for review."
        else:
            raise HTTPException(status_code=400, detail="Invalid review action. Must be APPROVE, REJECT, or REQUEST_CHANGES")

        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def admin_list_organizers(db: Session) -> List[Organizer]:
        return db.query(Organizer).options(joinedload(Organizer.user)).order_by(desc(Organizer.created_at)).all()

    @staticmethod
    def admin_verify_organizer(db: Session, admin: User, organizer_id: int, verify_data: OrganizerAdminVerify) -> Organizer:
        if admin.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Admin authorization required")

        org = db.query(Organizer).filter(Organizer.id == organizer_id).first()
        if not org:
            raise HTTPException(status_code=404, detail="Organizer not found")

        status_val = verify_data.status.upper()
        if status_val == "VERIFIED":
            org.verification_status = "VERIFIED"
            org.verified_by = admin.id
            org.verified_at = datetime.now(timezone.utc)
            org.rejection_reason = None
        elif status_val == "REJECTED":
            org.verification_status = "REJECTED"
            org.rejection_reason = verify_data.rejection_reason or "Organization credentials could not be verified."
        else:
            org.verification_status = "PENDING"

        db.commit()
        db.refresh(org)
        return org

    @staticmethod
    def admin_get_stats(db: Session) -> Dict[str, Any]:
        today = date.today()

        total_events = db.query(SportsEvent).count()
        published_events = db.query(SportsEvent).filter(SportsEvent.status == "PUBLISHED").count()
        pending_events = db.query(SportsEvent).filter(SportsEvent.status == "PENDING_REVIEW").count()
        rejected_events = db.query(SportsEvent).filter(SportsEvent.status == "REJECTED").count()
        upcoming_events = db.query(SportsEvent).filter(SportsEvent.status == "PUBLISHED", SportsEvent.end_date >= today).count()
        expired_events = db.query(SportsEvent).filter(SportsEvent.end_date < today).count()

        total_organizers = db.query(Organizer).count()
        verified_organizers = db.query(Organizer).filter(Organizer.verification_status == "VERIFIED").count()
        pending_organizers = db.query(Organizer).filter(Organizer.verification_status == "PENDING").count()

        total_saved = db.query(SavedEvent).count()
        total_views = db.query(func.coalesce(func.sum(SportsEvent.views_count), 0)).scalar() or 0

        recent_submissions = db.query(SportsEvent).order_by(desc(SportsEvent.created_at)).limit(5).all()

        return {
            "total_events": total_events,
            "published_events": published_events,
            "pending_events": pending_events,
            "rejected_events": rejected_events,
            "upcoming_events": upcoming_events,
            "expired_events": expired_events,
            "total_organizers": total_organizers,
            "verified_organizers": verified_organizers,
            "pending_organizers": pending_organizers,
            "total_saved_events": total_saved,
            "total_views": int(total_views),
            "recent_submissions": [EventService.get_event_by_id(db, e.id) for e in recent_submissions]
        }

    # -------------------------------------------------------------
    # Initial Realistic Seed Data
    # -------------------------------------------------------------
    @staticmethod
    def seed_default_events(db: Session) -> int:
        """
        Seeds verified upcoming sports tournaments and trials across India if not present.
        Idempotent operation.
        """
        existing_count = db.query(SportsEvent).count()
        if existing_count > 0:
            return existing_count

        sample_events = [
            {
                "title": "Coimbatore District Badminton Championship 2026",
                "sport": "Badminton",
                "event_type": "Championship",
                "description": "Annual district ranking badminton tournament organized under the aegis of Coimbatore District Badminton Association. Features Singles, Doubles, and Mixed Doubles across junior and senior categories.",
                "start_date": date(2026, 9, 15),
                "end_date": date(2026, 9, 18),
                "registration_deadline": date(2026, 9, 5),
                "start_time": "08:30 AM",
                "end_time": "08:00 PM",
                "venue": "Nehru Indoor Stadium",
                "city": "Coimbatore",
                "state": "Tamil Nadu",
                "country": "India",
                "age_min": 15,
                "age_max": 28,
                "gender": "All",
                "competition_level": "District",
                "entry_fee": "₹600 / Event",
                "prize_details": "₹75,000 Total Cash Prize, Medals & State Ranking Points",
                "eligibility": "Registered district players with valid BAI/CDBA ID card.",
                "organizer_name": "Coimbatore Badminton Association",
                "contact_email": "secretary@coimbatorebadminton.org",
                "contact_phone": "+91 98422 11234",
                "registration_url": "https://tnba.org.in/tournaments/coimbatore-district-2026",
                "source_url": "https://tnba.org.in/circulars/cdba-championship-2026.pdf",
                "status": "PUBLISHED",
                "verification_status": "VERIFIED"
            },
            {
                "title": "Tamil Nadu State Youth Football Selection Trials",
                "sport": "Football",
                "event_type": "Selection Trials",
                "description": "Official state youth squad scouting trials for the upcoming Santosh Trophy and Hero National Youth Championship squads. Conducted by TFA licensed technical scouts.",
                "start_date": date(2026, 9, 20),
                "end_date": date(2026, 9, 22),
                "registration_deadline": date(2026, 9, 12),
                "start_time": "07:00 AM",
                "end_time": "05:30 PM",
                "venue": "Jawaharlal Nehru Stadium Ground",
                "city": "Chennai",
                "state": "Tamil Nadu",
                "country": "India",
                "age_min": 17,
                "age_max": 23,
                "gender": "Male",
                "competition_level": "State",
                "entry_fee": "Free",
                "prize_details": "State Squad Induction & Full Athletic Kit Support",
                "eligibility": "Open to all Tamil Nadu domiciled football players. Must bring Aadhar and original birth certificate.",
                "organizer_name": "Tamil Nadu Football Association",
                "contact_email": "trials@tnfootball.in",
                "contact_phone": "+91 94440 55678",
                "registration_url": "https://tnfootball.in/trials/state-youth-2026",
                "source_url": "https://tnfootball.in/announcements/scouting-trials-2026",
                "status": "PUBLISHED",
                "verification_status": "VERIFIED"
            },
            {
                "title": "Bengaluru Open All-India Tennis Tournament (AITA)",
                "sport": "Tennis",
                "event_type": "Tournament",
                "description": "AITA-sanctioned National Series Men's and Women's singles and doubles tournament with 200 AITA ranking points on offer.",
                "start_date": date(2026, 10, 2),
                "end_date": date(2026, 10, 7),
                "registration_deadline": date(2026, 9, 24),
                "start_time": "08:00 AM",
                "end_time": "07:00 PM",
                "venue": "KSLTA Tennis Stadium, Cubbon Park",
                "city": "Bengaluru",
                "state": "Karnataka",
                "country": "India",
                "age_min": 16,
                "age_max": 35,
                "gender": "All",
                "competition_level": "National",
                "entry_fee": "₹1,500 / Singles, ₹2,000 / Doubles",
                "prize_details": "₹2,50,000 Total Purse & AITA National Ranking Points",
                "eligibility": "Active AITA Registration Number required.",
                "organizer_name": "Karnataka State Lawn Tennis Association",
                "contact_email": "tournaments@kslta.com",
                "contact_phone": "+91 80 2286 4333",
                "registration_url": "https://aitatennis.org/tournaments/bengaluru-open-2026",
                "source_url": "https://aitatennis.org/factsheet-bengaluru-2026.pdf",
                "status": "PUBLISHED",
                "verification_status": "VERIFIED"
            },
            {
                "title": "South Zone Inter-District Cricket League",
                "sport": "Cricket",
                "event_type": "League",
                "description": "50-Over format red-ball championship contested between top affiliated club and district academies in southern region.",
                "start_date": date(2026, 9, 28),
                "end_date": date(2026, 10, 10),
                "registration_deadline": date(2026, 9, 15),
                "start_time": "09:00 AM",
                "end_time": "05:00 PM",
                "venue": "SNR College Grounds & PSG Cricket Complex",
                "city": "Coimbatore",
                "state": "Tamil Nadu",
                "country": "India",
                "age_min": 18,
                "age_max": 30,
                "gender": "Male",
                "competition_level": "Divisional / Zonal",
                "entry_fee": "₹5,000 / Team",
                "prize_details": "₹1,00,000 Champions Trophy + Best Batsman & Bowler Awards",
                "eligibility": "Registered club teams. Maximum 16 players per squad.",
                "organizer_name": "Coimbatore District Cricket Association",
                "contact_email": "info@cdca-cricket.com",
                "contact_phone": "+91 98430 99887",
                "registration_url": "https://tnca.cricket/tournaments/south-zone-league-2026",
                "source_url": "https://tnca.cricket/rules-regulations-2026",
                "status": "PUBLISHED",
                "verification_status": "VERIFIED"
            },
            {
                "title": "Tamil Nadu State Junior Athletics Meet 2026",
                "sport": "Athletics",
                "event_type": "Open Meet",
                "description": "State-level track & field meet featuring 100m, 200m, 400m, 800m, 1500m, Hurdles, Long Jump, High Jump, and Shot Put. Official qualification for National Youth Athletics.",
                "start_date": date(2026, 10, 12),
                "end_date": date(2026, 10, 14),
                "registration_deadline": date(2026, 9, 30),
                "start_time": "06:30 AM",
                "end_time": "06:00 PM",
                "venue": "MGR Race Course Stadium",
                "city": "Madurai",
                "state": "Tamil Nadu",
                "country": "India",
                "age_min": 14,
                "age_max": 20,
                "gender": "All",
                "competition_level": "State",
                "entry_fee": "₹250 / Event",
                "prize_details": "State Championship Medals, Timing Certificates & National Qualification",
                "eligibility": "Affiliated district athletics association registration mandatory.",
                "organizer_name": "Tamil Nadu Athletics Association",
                "contact_email": "secretary@tnaa.in",
                "contact_phone": "+91 94432 77890",
                "registration_url": "https://tnaa.in/events/state-junior-2026",
                "source_url": "https://tnaa.in/circulars/junior-meet-circular-2026.pdf",
                "status": "PUBLISHED",
                "verification_status": "VERIFIED"
            },
            {
                "title": "All-India Inter-University Basketball Invitational",
                "sport": "Basketball",
                "event_type": "Tournament",
                "description": "Premier national university basketball championship hosted on world-class FIBA certified indoor wooden courts.",
                "start_date": date(2026, 10, 20),
                "end_date": date(2026, 10, 25),
                "registration_deadline": date(2026, 10, 5),
                "start_time": "09:00 AM",
                "end_time": "09:00 PM",
                "venue": "Indoor Sports Complex, SRM University",
                "city": "Chennai",
                "state": "Tamil Nadu",
                "country": "India",
                "age_min": 18,
                "age_max": 25,
                "gender": "All",
                "competition_level": "College / University",
                "entry_fee": "₹3,500 / University Team",
                "prize_details": "₹1,50,000 Trophy, Best MVP & Defensive Player Citations",
                "eligibility": "AIU registered collegiate athletes with valid student ID.",
                "organizer_name": "Basketball Federation of India / SRM Sports Directorate",
                "contact_email": "sports@srmuniv.ac.in",
                "contact_phone": "+91 44 2741 7000",
                "registration_url": "https://srmuniv.ac.in/basketball-invitational-2026",
                "source_url": "https://srmuniv.ac.in/events/sports-invitational-2026",
                "status": "PUBLISHED",
                "verification_status": "VERIFIED"
            }
        ]

        for item in sample_events:
            event = SportsEvent(
                title=item["title"],
                sport=item["sport"],
                event_type=item["event_type"],
                description=item["description"],
                start_date=item["start_date"],
                end_date=item["end_date"],
                registration_deadline=item["registration_deadline"],
                start_time=item["start_time"],
                end_time=item["end_time"],
                venue=item["venue"],
                city=item["city"],
                state=item["state"],
                country=item["country"],
                age_min=item["age_min"],
                age_max=item["age_max"],
                gender=item["gender"],
                competition_level=item["competition_level"],
                entry_fee=item["entry_fee"],
                prize_details=item["prize_details"],
                eligibility=item["eligibility"],
                organizer_name=item["organizer_name"],
                contact_email=item["contact_email"],
                contact_phone=item["contact_phone"],
                registration_url=item["registration_url"],
                source_url=item["source_url"],
                status=item["status"],
                verification_status=item["verification_status"],
                verified_at=datetime.now(timezone.utc)
            )
            db.add(event)

        db.commit()
        return len(sample_events)
