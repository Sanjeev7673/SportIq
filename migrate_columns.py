import sys
import os

sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.database.session import engine
from app.database.base import Base

with engine.connect() as conn:
    # 0. users table: make email nullable in SQLite
    user_info = conn.execute(text("PRAGMA table_info(users)")).fetchall()
    print("User table info:", user_info)
    # Check if email is NOT NULL (user_info row for email has notnull == 1)
    email_col = [r for r in user_info if r[1] == 'email']
    if email_col and email_col[0][3] == 1:
        print("Migrating users table in SQLite to make email nullable...")
        conn.execute(text("PRAGMA foreign_keys=off;"))
        conn.execute(text("""
            CREATE TABLE users_temp (
                id INTEGER PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE,
                phone_number VARCHAR(20) UNIQUE,
                phone_verified BOOLEAN DEFAULT 0 NOT NULL,
                email_verified BOOLEAN DEFAULT 0 NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'PLAYER' NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        conn.execute(text("""
            INSERT INTO users_temp (id, name, email, phone_number, phone_verified, email_verified, password_hash, role, created_at, updated_at)
            SELECT id, name, email, phone_number, phone_verified, email_verified, password_hash, role, created_at, updated_at FROM users;
        """))
        conn.execute(text("DROP TABLE users;"))
        conn.execute(text("ALTER TABLE users_temp RENAME TO users;"))
        conn.execute(text("PRAGMA foreign_keys=on;"))
        conn.commit()
        print("-> Users table successfully migrated with nullable email and unique phone_number.")

    # 1. performance_records
    cols = [r[1] for r in conn.execute(text("PRAGMA table_info(performance_records)")).fetchall()]
    if "source_type" not in cols:
        conn.execute(text("ALTER TABLE performance_records ADD COLUMN source_type VARCHAR(50) DEFAULT 'STANDARDIZED_FIELD_TEST'"))
        conn.execute(text("ALTER TABLE performance_records ADD COLUMN verification_status VARCHAR(50) DEFAULT 'UNVERIFIED'"))
        conn.execute(text("ALTER TABLE performance_records ADD COLUMN evidence_url VARCHAR(500)"))
        conn.execute(text("ALTER TABLE performance_records ADD COLUMN field_test_protocol VARCHAR(100)"))
        conn.execute(text("ALTER TABLE performance_records ADD COLUMN data_confidence_score FLOAT DEFAULT 65.0"))
        conn.execute(text("ALTER TABLE performance_records ADD COLUMN verified_by_coach_id INTEGER"))
        conn.execute(text("ALTER TABLE performance_records ADD COLUMN verification_notes TEXT"))
        conn.commit()
        print("-> Added inclusive multi-source columns to performance_records")

    # 2. ai_analysis
    ai_cols = [r[1] for r in conn.execute(text("PRAGMA table_info(ai_analysis)")).fetchall()]
    if "data_confidence_score" not in ai_cols:
        conn.execute(text("ALTER TABLE ai_analysis ADD COLUMN data_confidence_score FLOAT DEFAULT 70.0"))
        conn.commit()
        print("-> Added data_confidence_score column to ai_analysis")

    # 3. video_assessments
    va_cols = [r[1] for r in conn.execute(text("PRAGMA table_info(video_assessments)")).fetchall()]
    if "validation_status" not in va_cols:
        conn.execute(text("ALTER TABLE video_assessments ADD COLUMN validation_status VARCHAR(50) DEFAULT 'PENDING'"))
        conn.execute(text("ALTER TABLE video_assessments ADD COLUMN validation_reason TEXT"))
        conn.execute(text("ALTER TABLE video_assessments ADD COLUMN detected_sport VARCHAR(100)"))
        conn.execute(text("ALTER TABLE video_assessments ADD COLUMN detected_activity VARCHAR(100)"))
        conn.execute(text("ALTER TABLE video_assessments ADD COLUMN activity_confidence FLOAT DEFAULT 0.0"))
        conn.execute(text("ALTER TABLE video_assessments ADD COLUMN video_quality_score FLOAT DEFAULT 0.0"))
        conn.execute(text("ALTER TABLE video_assessments ADD COLUMN athlete_visibility_score FLOAT DEFAULT 0.0"))
        conn.execute(text("ALTER TABLE video_assessments ADD COLUMN athletes_detected_count INTEGER DEFAULT 1"))
        conn.execute(text("ALTER TABLE video_assessments ADD COLUMN camera_stability_score FLOAT DEFAULT 0.0"))
        conn.execute(text("ALTER TABLE video_assessments ADD COLUMN lighting_quality_score FLOAT DEFAULT 0.0"))
        conn.commit()
        print("-> Added validation gate columns to video_assessments")

    if "status" not in va_cols:
        conn.execute(text("ALTER TABLE video_assessments ADD COLUMN status VARCHAR(50) DEFAULT 'UPLOADED'"))
        conn.execute(text("ALTER TABLE video_assessments ADD COLUMN verified_by INTEGER"))
        conn.execute(text("ALTER TABLE video_assessments ADD COLUMN verified_at TIMESTAMP"))
        conn.execute(text("ALTER TABLE video_assessments ADD COLUMN rejected_by INTEGER"))
        conn.execute(text("ALTER TABLE video_assessments ADD COLUMN rejected_at TIMESTAMP"))
        conn.execute(text("ALTER TABLE video_assessments ADD COLUMN rejection_reason TEXT"))
        conn.commit()
        print("-> Added verification status columns to video_assessments")

    # 4. video_analysis_results
    var_cols = [r[1] for r in conn.execute(text("PRAGMA table_info(video_analysis_results)")).fetchall()]
    if "structured_strengths" not in var_cols:
        conn.execute(text("ALTER TABLE video_analysis_results ADD COLUMN structured_strengths TEXT"))
        conn.execute(text("ALTER TABLE video_analysis_results ADD COLUMN structured_weaknesses TEXT"))
        conn.execute(text("ALTER TABLE video_analysis_results ADD COLUMN observable_metrics TEXT"))
        conn.commit()
        print("-> Added structured pros/cons and observable metric columns to video_analysis_results")

# Ensure all tables (including otp_verifications and video_assessment_audits) exist
Base.metadata.create_all(bind=engine)
print("All database migrations verified and completed.")
