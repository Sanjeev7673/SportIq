from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks, status, Body
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.video_assessment import (
    SportAssessmentCatalogItem,
    VideoAssessmentResponse,
    VideoAssessmentListResponse,
    VerifyVideoAssessmentRequest,
    RejectVideoAssessmentRequest,
    VideoAssessmentAuditResponse
)
from app.schemas.common import APIResponse
from app.services.video_analysis_service import VideoAnalysisService

router = APIRouter(prefix="/video-assessments", tags=["AI Video Analysis"])


@router.get(
    "/types",
    response_model=APIResponse[List[SportAssessmentCatalogItem]],
    summary="List supported sports and assessment types catalog"
)
def get_assessment_catalog():
    """
    Retrieve structured taxonomy of sports (Football, Badminton, Tennis, etc.)
    and their specific assessment drill types.
    """
    catalog = VideoAnalysisService.get_catalog()
    return APIResponse(
        success=True,
        message="Sport assessment catalog retrieved successfully",
        data=catalog
    )


@router.post(
    "/upload",
    response_model=APIResponse[VideoAssessmentResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload daily video for AI performance analysis"
)
def upload_video_assessment(
    background_tasks: BackgroundTasks,
    sport: str = Form(..., description="Sport discipline (e.g. Football, Badminton, Tennis)"),
    assessment_type: str = Form(..., description="Assessment type (e.g. Sprint, Footwork, Serve)"),
    notes: Optional[str] = Form(None, description="Optional athlete notes"),
    file: UploadFile = File(..., description="Video file (MP4, MOV, WEBM)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.PLAYER]))
):
    """
    Upload an athlete training video for automated AI biomechanical analysis.
    The video is persisted and immediately queued for background non-blocking analysis.
    """
    assessment = VideoAnalysisService.upload_video_assessment(
        db=db,
        player_user=current_user,
        sport=sport,
        assessment_type=assessment_type,
        file=file,
        notes=notes
    )

    # Dispatch non-blocking background AI analysis
    background_tasks.add_task(VideoAnalysisService.process_video_background_task, assessment.id)

    return APIResponse(
        success=True,
        message="Video uploaded successfully and queued for AI performance analysis",
        data=VideoAssessmentResponse.model_validate(assessment)
    )


@router.get(
    "/my",
    response_model=APIResponse[VideoAssessmentListResponse],
    summary="Get athlete's video assessment history"
)
def get_my_video_assessments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.PLAYER]))
):
    """
    Retrieve full historical timeline of video assessments and AI breakdown for current player.
    """
    assessments = VideoAnalysisService.list_my_assessments(db, current_user)
    return APIResponse(
        success=True,
        message="Video assessments retrieved successfully",
        data=VideoAssessmentListResponse(
            assessments=[VideoAssessmentResponse.model_validate(a) for a in assessments],
            total=len(assessments)
        )
    )


@router.get(
    "/{assessment_id}",
    response_model=APIResponse[VideoAssessmentResponse],
    summary="Get detailed video assessment and AI analysis result"
)
def get_video_assessment_detail(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch single video assessment, processing status, movement indicators, and AI feedback.
    Enforces privacy access control.
    """
    assessment = VideoAnalysisService.get_assessment_by_id(db, assessment_id, current_user)
    return APIResponse(
        success=True,
        message="Video assessment details retrieved successfully",
        data=VideoAssessmentResponse.model_validate(assessment)
    )


@router.delete(
    "/{assessment_id}",
    response_model=APIResponse[dict],
    summary="Delete video assessment (Only before coach verification)"
)
def delete_video_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes an uploaded video assessment and cleans up the physical video file.
    SECURITY: Once verified by a coach (status == VERIFIED), deletion is rejected with HTTP 403 Forbidden.
    """
    result = VideoAnalysisService.delete_video_assessment(db, assessment_id, current_user)
    return APIResponse(
        success=True,
        message=result["message"],
        data=result
    )


@router.post(
    "/{assessment_id}/verify",
    response_model=APIResponse[VideoAssessmentResponse],
    summary="Coach verifies video assessment (Locks as immutable evidence)"
)
def verify_video_assessment(
    assessment_id: int,
    body: Optional[VerifyVideoAssessmentRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.COACH, UserRole.ADMIN]))
):
    """
    Enables an authorized coach or admin to certify and verify a video assessment.
    Once verified, the assessment becomes immutable evidence.
    """
    notes = body.notes if body else None
    assessment = VideoAnalysisService.verify_video_assessment(db, assessment_id, current_user, notes)
    return APIResponse(
        success=True,
        message="Video assessment verified successfully and recorded as immutable evidence",
        data=VideoAssessmentResponse.model_validate(assessment)
    )


@router.post(
    "/{assessment_id}/reject",
    response_model=APIResponse[VideoAssessmentResponse],
    summary="Coach rejects video assessment with feedback"
)
def reject_video_assessment(
    assessment_id: int,
    body: RejectVideoAssessmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.COACH, UserRole.ADMIN]))
):
    """
    Enables an authorized coach or admin to reject a video assessment with feedback.
    The athlete can then review the rejection and delete or re-upload.
    """
    assessment = VideoAnalysisService.reject_video_assessment(db, assessment_id, current_user, body.reason)
    return APIResponse(
        success=True,
        message="Video assessment marked as rejected",
        data=VideoAssessmentResponse.model_validate(assessment)
    )


@router.get(
    "/{assessment_id}/audit",
    response_model=APIResponse[List[VideoAssessmentAuditResponse]],
    summary="Get video assessment audit trail"
)
def get_video_assessment_audit_trail(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves full audit log history for an assessment (upload, analysis, verification, deletion).
    """
    # Verify access to assessment first
    _ = VideoAnalysisService.get_assessment_by_id(db, assessment_id, current_user)
    audits = VideoAnalysisService.get_assessment_audit_trail(db, assessment_id, current_user)
    return APIResponse(
        success=True,
        message="Audit trail retrieved successfully",
        data=audits
    )


@router.get(
    "/player/{player_id}",
    response_model=APIResponse[VideoAssessmentListResponse],
    summary="View athlete video assessments (Coach, Scout, Admin)"
)
def get_player_video_assessments_for_coach(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.COACH, UserRole.SCOUT, UserRole.ADMIN]))
):
    """
    Allows authorized coaches and scouts to review all daily video sessions and AI metrics for an athlete.
    """
    assessments = VideoAnalysisService.list_player_assessments_for_coach(db, player_id, current_user)
    return APIResponse(
        success=True,
        message="Player video assessments retrieved successfully",
        data=VideoAssessmentListResponse(
            assessments=[VideoAssessmentResponse.model_validate(a) for a in assessments],
            total=len(assessments)
        )
    )
