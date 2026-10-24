import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import SessionLocal, engine
from app.database.base import Base
from app.models.sport import Sport
from app.models.user import User
from app.models.enums import UserRole
from app.core.security import get_password_hash

DEFAULT_SPORTS = [
    {"name": "Football", "description": "Association football / soccer involving 11-a-side matches."},
    {"name": "Basketball", "description": "High-intensity court sport emphasizing agility, vertical leap, and shooting."},
    {"name": "Cricket", "description": "Bat-and-ball discipline measuring bowling speed, batting accuracy, and fielding stamina."},
    {"name": "Athletics", "description": "Track and field events including sprinting, middle-distance, and endurance running."},
    {"name": "Badminton", "description": "Fast-paced racket sport requiring explosive lateral agility and reflexes."},
]


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("[SportIQ Seeder] Starting database seed...")

    # 1. Seed Sports
    for s_data in DEFAULT_SPORTS:
        existing = db.query(Sport).filter(Sport.name == s_data["name"]).first()
        if not existing:
            sport = Sport(name=s_data["name"], description=s_data["description"])
            db.add(sport)
            print(f"  + Added Sport: {s_data['name']}")
        else:
            print(f"  * Sport already exists: {s_data['name']}")

    # 2. Seed Default Super Admin
    admin_email = "admin@sportiq.ai"
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if not existing_admin:
        admin_user = User(
            name="Platform Administrator",
            email=admin_email,
            password_hash=get_password_hash("Admin123!"),
            role=UserRole.ADMIN
        )
        db.add(admin_user)
        print(f"  + Added Default Admin: {admin_email} (password: Admin123!)")
    else:
        print(f"  * Admin user already exists: {admin_email}")

    db.commit()
    db.close()
    print("[SportIQ Seeder] Seeding completed successfully.")


if __name__ == "__main__":
    seed_database()
