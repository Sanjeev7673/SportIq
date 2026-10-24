import os
import uuid
from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from fastapi import HTTPException, UploadFile, status

from app.models.performance import PerformanceRecord
from app.models.player import Player
from app.models.user import User
from app.models.enums import UserRole, DataSourceType, VerificationStatus
from app.services.confidence_service import ConfidenceService
from app.schemas.performance import (
    PerformanceCreate,
    PerformanceUpdate,
    PerformanceVerificationRequest,
    PerformanceStatsSummary,
    PerformanceHistoryResponse,
    PerformanceResponse,
    EvidenceUploadResponse
)


class PerformanceService:
    @staticmethod
    def add_performance_record(
        db: Session,
        user: User,
        data: PerformanceCreate
    ) -> PerformanceRecord:
        """
        Logs a multi-source performance assessment record for an athlete.
        - Athletes log for themselves.
        - Coaches & Admins can log for any registered athlete by providing player_id.
        - Computes transparent Data Confidence Score based on source type and evidence.
        """
        target_player_id: Optional[int] = None
        is_coach_admin = user.role in [UserRole.COACH, UserRole.ADMIN]

        if user.role == UserRole.PLAYER:
            player = db.query(Player).filter(Player.user_id == user.id).first()
            if not player:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Please create your athletic profile before logging performance data"
                )
            target_player_id = player.id
        elif is_coach_admin:
            if not data.player_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="player_id is required when logging performance as a Coach or Admin"
                )
            player = db.query(Player).filter(Player.id == data.player_id).first()
            if not player:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Player with ID {data.player_id} not found"
                )
            target_player_id = player.id
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Scouts cannot log performance records"
            )

        # Determine source type and verification status
        source_type_val = data.source_type.value if hasattr(data.source_type, 'value') else (data.source_type or "STANDARDIZED_FIELD_TEST")
        if is_coach_admin:
            verification_status_val = "COACH_VERIFIED"
            verified_by_coach_id = user.id
            is_coach_verified = True
        else:
            verification_status_val = "UNVERIFIED"
            verified_by_coach_id = None
            is_coach_verified = False

        # Calculate Data Confidence Score
        confidence_score = ConfidenceService.calculate_confidence(
            source_type=source_type_val,
            verification_status=verification_status_val,
            evidence_url=data.evidence_url,
            field_test_protocol=data.field_test_protocol,
            speed=data.speed,
            stamina=data.stamina,
            strength=data.strength,
            agility=data.agility,
            accuracy=data.accuracy,
            is_coach_verified=is_coach_verified
        )

        new_record = PerformanceRecord(
            player_id=target_player_id,
            speed=data.speed,
            stamina=data.stamina,
            strength=data.strength,
            agility=data.agility,
            accuracy=data.accuracy,
            matches_played=data.matches_played,
            assessment_date=data.assessment_date or date.today(),
            source_type=source_type_val,
            verification_status=verification_status_val,
            evidence_url=data.evidence_url,
            field_test_protocol=data.field_test_protocol,
            data_confidence_score=confidence_score,
            verified_by_coach_id=verified_by_coach_id,
            verification_notes=data.verification_notes
        )

        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return new_record

    @staticmethod
    def verify_performance_record(
        db: Session,
        coach_user: User,
        record_id: int,
        data: PerformanceVerificationRequest
    ) -> PerformanceRecord:
        """
        Allows coaches or platform admins to verify an athlete's performance record,
        upgrading its verification status and recalculating data confidence score.
        """
        if coach_user.role not in [UserRole.COACH, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Coaches and Admins can certify and verify performance records"
            )

        record = db.query(PerformanceRecord).filter(PerformanceRecord.id == record_id).first()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Performance record with ID {record_id} not found"
            )

        status_val = data.verification_status.value if hasattr(data.verification_status, 'value') else data.verification_status
        record.verification_status = status_val
        record.verified_by_coach_id = coach_user.id
        if data.verification_notes:
            record.verification_notes = data.verification_notes

        # Re-compute boosted confidence
        record.data_confidence_score = ConfidenceService.calculate_confidence(
            source_type=record.source_type,
            verification_status=status_val,
            evidence_url=record.evidence_url,
            field_test_protocol=record.field_test_protocol,
            speed=record.speed,
            stamina=record.stamina,
            strength=record.strength,
            agility=record.agility,
            accuracy=record.accuracy,
            is_coach_verified=True
        )

        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def upload_evidence_file(file: UploadFile) -> EvidenceUploadResponse:
        """
        Accepts smartphone video or photo proof (MP4, WebM, MOV, JPG, PNG, PDF up to 50MB)
        and persists to /uploads/evidence/.
        """
        allowed_extensions = {".mp4", ".webm", ".mov", ".jpg", ".jpeg", ".png", ".pdf"}
        ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
        if ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type '{ext}'. Allowed formats: MP4, WebM, MOV, JPG, PNG, PDF."
            )

        content = file.file.read()
        max_size = 50 * 1024 * 1024  # 50MB limit for video proof
        if len(content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Evidence file exceeds the 50MB limit."
            )

        upload_dir = os.path.join("uploads", "evidence")
        os.makedirs(upload_dir, exist_ok=True)
        unique_filename = f"evidence_{uuid.uuid4().hex[:12]}{ext}"
        file_path = os.path.join(upload_dir, unique_filename)

        with open(file_path, "wb") as f:
            f.write(content)

        relative_url = f"/uploads/evidence/{unique_filename}"
        return EvidenceUploadResponse(
            evidence_url=relative_url,
            filename=unique_filename,
            content_type=file.content_type or "application/octet-stream"
        )

    @staticmethod
    def get_player_performance_history(
        db: Session,
        player_id: int
    ) -> List[PerformanceRecord]:
        """
        Retrieves historical performance records for a player, sorted chronologically.
        """
        player = db.query(Player).filter(Player.id == player_id).first()
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Player with ID {player_id} not found"
            )

        records = (
            db.query(PerformanceRecord)
            .filter(PerformanceRecord.player_id == player_id)
            .order_by(asc(PerformanceRecord.assessment_date), asc(PerformanceRecord.created_at))
            .all()
        )
        return records

    @staticmethod
    def get_player_performance_stats(
        db: Session,
        player_id: int
    ) -> PerformanceStatsSummary:
        """
        Calculates aggregate statistics (averages, maximums, totals, and average confidence) for a player.
        """
        player = db.query(Player).filter(Player.id == player_id).first()
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Player with ID {player_id} not found"
            )

        records = db.query(PerformanceRecord).filter(PerformanceRecord.player_id == player_id).all()
        total_records = len(records)

        if total_records == 0:
            return PerformanceStatsSummary(
                player_id=player_id,
                total_records=0,
                avg_speed=0.0,
                avg_stamina=0.0,
                avg_strength=0.0,
                avg_agility=0.0,
                avg_accuracy=0.0,
                max_speed=0.0,
                max_stamina=0.0,
                max_strength=0.0,
                max_agility=0.0,
                max_accuracy=0.0,
                total_matches_played=0,
                latest_assessment_date=None,
                avg_data_confidence_score=0.0,
                verified_records_count=0
            )

        avg_speed = round(sum(r.speed for r in records) / total_records, 2)
        avg_stamina = round(sum(r.stamina for r in records) / total_records, 2)
        avg_strength = round(sum(r.strength for r in records) / total_records, 2)
        avg_agility = round(sum(r.agility for r in records) / total_records, 2)
        avg_accuracy = round(sum(r.accuracy for r in records) / total_records, 2)

        max_speed = round(max(r.speed for r in records), 2)
        max_stamina = round(max(r.stamina for r in records), 2)
        max_strength = round(max(r.strength for r in records), 2)
        max_agility = round(max(r.agility for r in records), 2)
        max_accuracy = round(max(r.accuracy for r in records), 2)

        total_matches = sum(r.matches_played for r in records)
        latest_date = max(r.assessment_date for r in records)

        avg_confidence = round(sum(getattr(r, 'data_confidence_score', 65.0) for r in records) / total_records, 1)
        verified_count = sum(1 for r in records if r.verification_status == "COACH_VERIFIED")

        return PerformanceStatsSummary(
            player_id=player_id,
            total_records=total_records,
            avg_speed=avg_speed,
            avg_stamina=avg_stamina,
            avg_strength=avg_strength,
            avg_agility=avg_agility,
            avg_accuracy=avg_accuracy,
            max_speed=max_speed,
            max_stamina=max_stamina,
            max_strength=max_strength,
            max_agility=max_agility,
            max_accuracy=max_accuracy,
            total_matches_played=total_matches,
            latest_assessment_date=latest_date,
            avg_data_confidence_score=avg_confidence,
            verified_records_count=verified_count
        )

    @staticmethod
    def update_performance_record(
        db: Session,
        user: User,
        record_id: int,
        data: PerformanceUpdate
    ) -> PerformanceRecord:
        """
        Updates an existing performance record. Enforces ownership check.
        """
        record = db.query(PerformanceRecord).filter(PerformanceRecord.id == record_id).first()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Performance record with ID {record_id} not found"
            )

        # Check permission: User must own the profile, or be a COACH/ADMIN
        if user.role == UserRole.PLAYER:
            player = db.query(Player).filter(Player.user_id == user.id).first()
            if not player or record.player_id != player.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to update this performance record"
                )

        update_dict = data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            if key == "source_type" and hasattr(val, "value"):
                val = val.value
            setattr(record, key, val)

        # Recalculate confidence
        record.data_confidence_score = ConfidenceService.calculate_confidence(
            source_type=record.source_type,
            verification_status=record.verification_status,
            evidence_url=record.evidence_url,
            field_test_protocol=record.field_test_protocol,
            speed=record.speed,
            stamina=record.stamina,
            strength=record.strength,
            agility=record.agility,
            accuracy=record.accuracy,
            is_coach_verified=(record.verification_status == "COACH_VERIFIED")
        )

        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def delete_performance_record(
        db: Session,
        user: User,
        record_id: int
    ) -> bool:
        """
        Deletes a performance record. Enforces ownership check.
        """
        record = db.query(PerformanceRecord).filter(PerformanceRecord.id == record_id).first()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Performance record with ID {record_id} not found"
            )

        # Check permission: User must own the profile, or be a COACH/ADMIN
        if user.role == UserRole.PLAYER:
            player = db.query(Player).filter(Player.user_id == user.id).first()
            if not player or record.player_id != player.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to delete this performance record"
                )

        db.delete(record)
        db.commit()
        return True
