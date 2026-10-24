import datetime
from datetime import date, datetime, timezone, timedelta
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, asc, or_
from fastapi import HTTPException, status

from app.models.user import User
from app.models.player import Player
from app.models.sport import Sport
from app.models.performance import PerformanceRecord
from app.models.ai_analysis import AIAnalysis
from app.models.shortlist import Shortlist
from app.models.training_recommendation import TrainingRecommendation
from app.models.event import Organizer, SportsEvent, SavedEvent
from app.models.enums import UserRole
from app.core.security import get_password_hash
from app.schemas.admin import (
    UserAdminUpdate,
    PlatformStatsResponse,
    PlatformReportsResponse,
    PlatformSettings,
    AthleteAdminItem,
    CoachAdminItem,
    ScoutAdminItem,
    AdminNotificationItem,
)
from app.schemas.event import EventOut
from app.services.event_service import EventService

# In-memory platform settings store (persisted across service lifetime)
_PLATFORM_SETTINGS = PlatformSettings()


class AdminService:
    @staticmethod
    def seed_dev_admin_user(db: Session):
        """
        Ensures a standard development admin account exists:
        admin@sportiq.ai / Admin@SportIQ2026!
        """
        existing = db.query(User).filter(User.email == "admin@sportiq.ai").first()
        if not existing:
            dev_admin = User(
                name="Platform Superuser",
                email="admin@sportiq.ai",
                password_hash=get_password_hash("Admin@SportIQ2026!"),
                role=UserRole.ADMIN,
                email_verified=True,
                is_active=True
            )
            db.add(dev_admin)
            db.commit()

    @staticmethod
    def list_users(
        db: Session,
        role: Optional[UserRole] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[User], int]:
        query = db.query(User)
        if role:
            query = query.filter(User.role == role)
        if search:
            search_pat = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.name.ilike(search_pat),
                    User.email.ilike(search_pat),
                    User.phone_number.ilike(search_pat)
                )
            )

        total = query.count()
        users = query.order_by(desc(User.created_at)).offset((page - 1) * limit).limit(limit).all()
        return users, total

    @staticmethod
    def list_athletes(
        db: Session,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        limit: int = 50
    ) -> Tuple[List[AthleteAdminItem], int]:
        query = db.query(User).options(joinedload(User.player_profile)).filter(User.role == UserRole.PLAYER)

        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        if search:
            search_pat = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.name.ilike(search_pat),
                    User.email.ilike(search_pat),
                    User.phone_number.ilike(search_pat)
                )
            )

        total = query.count()
        users = query.order_by(desc(User.created_at)).offset((page - 1) * limit).limit(limit).all()

        results = []
        for u in users:
            p = u.player_profile
            results.append(
                AthleteAdminItem(
                    user_id=u.id,
                    player_id=p.id if p else None,
                    name=u.name,
                    email=u.email,
                    phone_number=u.phone_number,
                    sport=p.sport if p else "Unspecified",
                    position=p.position if p else None,
                    age=p.age if p else None,
                    gender=p.gender if p else None,
                    location="Tamil Nadu, India",
                    experience=p.experience if p else 0,
                    is_active=u.is_active,
                    profile_completed=bool(p and p.sport),
                    created_at=u.created_at or datetime.now(timezone.utc)
                )
            )

        return results, total

    @staticmethod
    def list_coaches(
        db: Session,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        limit: int = 50
    ) -> Tuple[List[CoachAdminItem], int]:
        query = db.query(User).options(joinedload(User.created_recommendations)).filter(User.role == UserRole.COACH)

        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        if search:
            search_pat = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.name.ilike(search_pat),
                    User.email.ilike(search_pat),
                    User.phone_number.ilike(search_pat)
                )
            )

        total = query.count()
        users = query.order_by(desc(User.created_at)).offset((page - 1) * limit).limit(limit).all()

        results = []
        for u in users:
            results.append(
                CoachAdminItem(
                    user_id=u.id,
                    name=u.name,
                    email=u.email,
                    phone_number=u.phone_number,
                    organization="SportIQ Coaching Academy",
                    is_active=u.is_active,
                    recommendations_count=len(u.created_recommendations or []),
                    created_at=u.created_at or datetime.now(timezone.utc)
                )
            )

        return results, total

    @staticmethod
    def list_scouts(
        db: Session,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        limit: int = 50
    ) -> Tuple[List[ScoutAdminItem], int]:
        query = db.query(User).options(joinedload(User.shortlists)).filter(User.role == UserRole.SCOUT)

        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        if search:
            search_pat = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.name.ilike(search_pat),
                    User.email.ilike(search_pat),
                    User.phone_number.ilike(search_pat)
                )
            )

        total = query.count()
        users = query.order_by(desc(User.created_at)).offset((page - 1) * limit).limit(limit).all()

        results = []
        for u in users:
            results.append(
                ScoutAdminItem(
                    user_id=u.id,
                    name=u.name,
                    email=u.email,
                    phone_number=u.phone_number,
                    organization="Independent Talent Scout",
                    is_active=u.is_active,
                    shortlists_count=len(u.shortlists or []),
                    created_at=u.created_at or datetime.now(timezone.utc)
                )
            )

        return results, total

    @staticmethod
    def toggle_user_status(db: Session, user_id: int, is_active: bool) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.is_active = is_active
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update_user(db: Session, user_id: int, data: UserAdminUpdate) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if data.name is not None:
            user.name = data.name.strip()
        if data.role is not None:
            user.role = data.role
        if data.is_active is not None:
            user.is_active = data.is_active

        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def delete_user(db: Session, user_id: int):
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        db.delete(user)
        db.commit()

    @staticmethod
    def create_sport(db: Session, data) -> Sport:
        existing = db.query(Sport).filter(Sport.name.ilike(data.name.strip())).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Sport '{data.name}' already exists")

        sport = Sport(
            name=data.name.strip(),
            description=data.description.strip() if data.description else None
        )
        db.add(sport)
        db.commit()
        db.refresh(sport)
        return sport

    @staticmethod
    def list_sports(db: Session) -> List[Sport]:
        return db.query(Sport).order_by(Sport.name).all()

    @staticmethod
    def delete_sport(db: Session, sport_id: int):
        sport = db.query(Sport).filter(Sport.id == sport_id).first()
        if not sport:
            raise HTTPException(status_code=404, detail="Sport not found")
        db.delete(sport)
        db.commit()

    @staticmethod
    def delete_performance_record(db: Session, record_id: int):
        rec = db.query(PerformanceRecord).filter(PerformanceRecord.id == record_id).first()
        if not rec:
            raise HTTPException(status_code=404, detail="Performance record not found")
        db.delete(rec)
        db.commit()

    @staticmethod
    def get_platform_stats(db: Session) -> PlatformStatsResponse:
        total_users = db.query(User).count()
        total_players = db.query(Player).count()
        total_performance_records = db.query(PerformanceRecord).count()
        total_ai_assessments = db.query(AIAnalysis).count()

        # Users by role
        roles_counts = db.query(User.role, func.count(User.id)).group_by(User.role).all()
        users_by_role = {role.value: count for role, count in roles_counts}

        # Players per sport
        sport_counts = db.query(Player.sport, func.count(Player.id)).group_by(Player.sport).all()
        players_per_sport = [
            {"sport": sport or "Unspecified", "count": count}
            for sport, count in sport_counts
        ]

        return PlatformStatsResponse(
            total_users=total_users,
            total_players=total_players,
            total_performance_records=total_performance_records,
            total_ai_assessments=total_ai_assessments,
            users_by_role=users_by_role,
            players_per_sport=players_per_sport
        )

    @staticmethod
    def get_admin_dashboard(db: Session) -> Dict[str, Any]:
        """
        Aggregates live summary cards and recent activity streams for the Admin Dashboard.
        """
        today = date.today()
        EventService.seed_default_events(db)

        # User counts
        total_users = db.query(User).count()
        total_athletes = db.query(User).filter(User.role == UserRole.PLAYER).count()
        total_coaches = db.query(User).filter(User.role == UserRole.COACH).count()
        total_scouts = db.query(User).filter(User.role == UserRole.SCOUT).count()
        total_organizers = db.query(User).filter(User.role == UserRole.ORGANIZER).count()

        # Event counts
        total_events = db.query(SportsEvent).count()
        published_events = db.query(SportsEvent).filter(SportsEvent.status == "PUBLISHED").count()
        pending_events = db.query(SportsEvent).filter(SportsEvent.status == "PENDING_REVIEW").count()
        rejected_events = db.query(SportsEvent).filter(SportsEvent.status == "REJECTED").count()
        upcoming_events = db.query(SportsEvent).filter(SportsEvent.status == "PUBLISHED", SportsEvent.end_date >= today).count()

        # Recent activities
        recent_users = db.query(User).order_by(desc(User.created_at)).limit(5).all()

        recent_submissions = db.query(SportsEvent).filter(
            SportsEvent.status == "PENDING_REVIEW"
        ).order_by(desc(SportsEvent.created_at)).limit(5).all()
        if not recent_submissions:
            recent_submissions = db.query(SportsEvent).order_by(desc(SportsEvent.created_at)).limit(5).all()

        recent_approvals = db.query(SportsEvent).filter(
            SportsEvent.status == "PUBLISHED",
            SportsEvent.verification_status == "VERIFIED"
        ).order_by(desc(SportsEvent.verified_at)).limit(5).all()

        return {
            "total_users": total_users,
            "total_athletes": total_athletes,
            "total_coaches": total_coaches,
            "total_scouts": total_scouts,
            "total_organizers": total_organizers,
            "total_events": total_events,
            "published_events": published_events,
            "pending_events": pending_events,
            "rejected_events": rejected_events,
            "upcoming_events": upcoming_events,
            "recent_users": recent_users,
            "recent_event_submissions": [EventService.get_event_by_id(db, e.id) for e in recent_submissions],
            "recent_event_approvals": [EventService.get_event_by_id(db, e.id) for e in recent_approvals]
        }

    @staticmethod
    def get_platform_reports(db: Session) -> PlatformReportsResponse:
        today = date.today()
        total_users = db.query(User).count()

        roles_counts = db.query(User.role, func.count(User.id)).group_by(User.role).all()
        users_by_role = {role.value: count for role, count in roles_counts}

        total_events = db.query(SportsEvent).count()
        published_events = db.query(SportsEvent).filter(SportsEvent.status == "PUBLISHED").count()
        pending_events = db.query(SportsEvent).filter(SportsEvent.status == "PENDING_REVIEW").count()
        rejected_events = db.query(SportsEvent).filter(SportsEvent.status == "REJECTED").count()
        expired_events = db.query(SportsEvent).filter(SportsEvent.end_date < today).count()
        upcoming_events = db.query(SportsEvent).filter(SportsEvent.status == "PUBLISHED", SportsEvent.end_date >= today).count()

        total_organizers = db.query(Organizer).count()
        verified_organizers = db.query(Organizer).filter(Organizer.verification_status == "VERIFIED").count()
        pending_organizers = db.query(Organizer).filter(Organizer.verification_status == "PENDING").count()

        total_views = db.query(func.coalesce(func.sum(SportsEvent.views_count), 0)).scalar() or 0

        # Breakdown by sport
        athlete_sport_counts = db.query(Player.sport, func.count(Player.id)).group_by(Player.sport).all()
        athletes_per_sport = [
            {"sport": sport or "Unspecified", "count": count}
            for sport, count in athlete_sport_counts
        ]

        event_sport_counts = db.query(SportsEvent.sport, func.count(SportsEvent.id)).group_by(SportsEvent.sport).all()
        events_per_sport = [
            {"sport": sport or "Unspecified", "count": count}
            for sport, count in event_sport_counts
        ]

        return PlatformReportsResponse(
            total_users=total_users,
            users_by_role=users_by_role,
            total_events=total_events,
            published_events=published_events,
            pending_events=pending_events,
            rejected_events=rejected_events,
            expired_events=expired_events,
            upcoming_events=upcoming_events,
            total_organizers=total_organizers,
            verified_organizers=verified_organizers,
            pending_organizers=pending_organizers,
            total_views=int(total_views),
            athletes_per_sport=athletes_per_sport,
            events_per_sport=events_per_sport
        )

    @staticmethod
    def get_admin_notifications(db: Session) -> List[AdminNotificationItem]:
        notifications = []
        now = datetime.now(timezone.utc)

        # 1. Pending Event Submissions
        pending_events_count = db.query(SportsEvent).filter(SportsEvent.status == "PENDING_REVIEW").count()
        if pending_events_count > 0:
            notifications.append(
                AdminNotificationItem(
                    id="notif-events-pending",
                    title="Event Submissions Awaiting Verification",
                    message=f"{pending_events_count} tournament submissions are waiting for administrative review and publication.",
                    category="EVENT_SUBMISSION",
                    link="/admin/events/verification",
                    created_at=now,
                    count=pending_events_count
                )
            )

        # 2. Pending Organizer Verifications
        pending_orgs_count = db.query(Organizer).filter(Organizer.verification_status == "PENDING").count()
        if pending_orgs_count > 0:
            notifications.append(
                AdminNotificationItem(
                    id="notif-orgs-pending",
                    title="Organizer Accounts Awaiting Accreditation",
                    message=f"{pending_orgs_count} sports organizations have applied for verified host status.",
                    category="ORGANIZER_VERIFICATION",
                    link="/admin/organizers",
                    created_at=now,
                    count=pending_orgs_count
                )
            )

        # 3. Recent Signups
        recent_signups_count = db.query(User).count()
        notifications.append(
            AdminNotificationItem(
                id="notif-users-active",
                title="Platform User Registrations",
                message=f"{recent_signups_count} active user accounts registered across athletes, coaches, scouts, and organizers.",
                category="NEW_USER",
                link="/admin/users",
                created_at=now,
                count=recent_signups_count
            )
        )

        return notifications

    @staticmethod
    def get_platform_settings() -> PlatformSettings:
        global _PLATFORM_SETTINGS
        return _PLATFORM_SETTINGS

    @staticmethod
    def update_platform_settings(new_settings: PlatformSettings) -> PlatformSettings:
        global _PLATFORM_SETTINGS
        _PLATFORM_SETTINGS = new_settings
        return _PLATFORM_SETTINGS
