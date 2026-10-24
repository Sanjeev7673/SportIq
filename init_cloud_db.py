import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import SessionLocal, engine
from app.database.base import Base
from app.models.sport import Sport
from app.models.user import User
from app.models.enums import UserRole
from app.core.security import get_password_hash
from app.core.config import settings

DEFAULT_SPORTS = [
    {"name": "Football", "description": "Association football / soccer involving 11-a-side matches."},
    {"name": "Basketball", "description": "High-intensity court sport emphasizing agility, vertical leap, and shooting."},
    {"name": "Cricket", "description": "Bat-and-ball discipline measuring bowling speed, batting accuracy, and fielding stamina."},
    {"name": "Athletics", "description": "Track and field events including sprinting, middle-distance, and endurance running."},
    {"name": "Badminton", "description": "Fast-paced racket sport requiring explosive lateral agility and reflexes."},
]


def init_cloud_database():
    print("=" * 70)
    print(" SPORTIQ PRODUCTION DATABASE INITIALIZER")
    print(f" Target Database: {settings.DATABASE_URL[:25]}... (Environment: {settings.ENVIRONMENT})")
    print("=" * 70)

    # 1. Create all tables in Cloud PostgreSQL
    print("[1/3] Creating PostgreSQL schema tables via SQLAlchemy ORM...")
    Base.metadata.create_all(bind=engine)
    print("  -> Tables created successfully.")

    db = SessionLocal()
    try:
        # 2. Seed Default Sports Catalog
        print("[2/3] Seeding default sports taxonomy...")
        for s_data in DEFAULT_SPORTS:
            existing = db.query(Sport).filter(Sport.name == s_data["name"]).first()
            if not existing:
                sport = Sport(name=s_data["name"], description=s_data["description"])
                db.add(sport)
                print(f"  + Added Sport: {s_data['name']}")
            else:
                print(f"  * Sport already present: {s_data['name']}")

        # 3. Seed Default Super Admin Account
        admin_email = os.getenv("ADMIN_EMAIL", "admin@sportiq.ai")
        admin_password = os.getenv("ADMIN_PASSWORD", "Admin123!")

        print("[3/3] Verifying Super Admin account...")
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if not existing_admin:
            admin_user = User(
                name="Platform Administrator",
                email=admin_email,
                password_hash=get_password_hash(admin_password),
                role=UserRole.ADMIN
            )
            db.add(admin_user)
            print(f"  + Created Super Admin: {admin_email}")
        else:
            print(f"  * Super Admin already present: {admin_email}")

        db.commit()
        print("=" * 70)
        print(" PRODUCTION DATABASE INITIALIZATION COMPLETED SUCCESSFULLY")
        print("=" * 70)
    except Exception as e:
        db.rollback()
        print(f" [ERROR] Database initialization failed: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_cloud_database()
