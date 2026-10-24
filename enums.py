import enum


class UserRole(str, enum.Enum):
    PLAYER = "PLAYER"
    COACH = "COACH"
    SCOUT = "SCOUT"
    ORGANIZER = "ORGANIZER"
    ADMIN = "ADMIN"


class PotentialLevel(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    DEVELOPING = "DEVELOPING"


class RecommendationStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class DataSourceType(str, enum.Enum):
    SMARTPHONE_DERIVED = "SMARTPHONE_DERIVED"
    STANDARDIZED_FIELD_TEST = "STANDARDIZED_FIELD_TEST"
    COACH_VERIFIED = "COACH_VERIFIED"
    WEARABLE_DEVICE = "WEARABLE_DEVICE"
    SELF_REPORTED_MANUAL = "SELF_REPORTED_MANUAL"


class VerificationStatus(str, enum.Enum):
    UNVERIFIED = "UNVERIFIED"
    COACH_VERIFIED = "COACH_VERIFIED"
    AI_VIDEO_VERIFIED = "AI_VIDEO_VERIFIED"
    SYSTEM_VALIDATED = "SYSTEM_VALIDATED"


class EventStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING_REVIEW = "PENDING_REVIEW"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"
    PUBLISHED = "PUBLISHED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class EventVerificationStatus(str, enum.Enum):
    UNVERIFIED = "UNVERIFIED"
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class OrganizerStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class CompetitionLevel(str, enum.Enum):
    SCHOOL = "School"
    COLLEGE = "College / University"
    CLUB = "Club"
    DISTRICT = "District"
    DIVISIONAL = "Divisional / Zonal"
    STATE = "State"
    NATIONAL = "National"
    INTERNATIONAL = "International"
    OPEN = "Open"


class EventType(str, enum.Enum):
    TOURNAMENT = "Tournament"
    CHAMPIONSHIP = "Championship"
    SELECTION_TRIALS = "Selection Trials"
    LEAGUE = "League"
    OPEN_MEET = "Open Meet"
    WORKSHOP_CAMP = "Workshop / Coaching Camp"
    EXHIBITION_MATCH = "Exhibition Match"
