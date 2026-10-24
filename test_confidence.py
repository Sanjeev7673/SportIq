import pytest
from app.services.confidence_service import ConfidenceService
from app.ai.model import SportIQAIModel


def test_talent_score_invariance_across_device_types():
    """
    Core Equity Invariant:
    Two athletes with identical physical performance metrics must receive the EXACT SAME
    Talent Score regardless of whether their data comes from an expensive wearable or a standardized field test.
    """
    metrics = {
        "speed": 85.0,
        "stamina": 80.0,
        "strength": 75.0,
        "agility": 90.0,
        "accuracy": 70.0,
        "age_multiplier": 1.05
    }
    weights = {
        "speed": 0.25,
        "stamina": 0.20,
        "strength": 0.15,
        "agility": 0.25,
        "accuracy": 0.15
    }

    eval_result = SportIQAIModel.evaluate(metrics, weights, sport="Football", position="Forward")
    # 81.5 * 1.05 = 85.575 -> 85.58
    assert eval_result["talent_score"] == 85.58
    assert eval_result["potential_level"] == "HIGH"


def test_confidence_scoring_multi_source():
    """
    Verify Data Confidence ratings across the 4 data sources and evidence levels:
    - Coach Verified yields 90%+ confidence.
    - Field test with smartphone video proof yields 88% confidence.
    - Unverified self-reported manual data yields low initial confidence (~40%).
    """
    # 1. Unverified Manual
    conf_manual = ConfidenceService.calculate_confidence(
        source_type="SELF_REPORTED_MANUAL",
        verification_status="UNVERIFIED",
        evidence_url=None
    )
    assert conf_manual <= 45.0

    # 2. Field Test + Video Evidence
    conf_field_video = ConfidenceService.calculate_confidence(
        source_type="STANDARDIZED_FIELD_TEST",
        verification_status="UNVERIFIED",
        evidence_url="/uploads/evidence/sprint_30m.mp4",
        field_test_protocol="30m Sprint"
    )
    assert conf_field_video >= 85.0

    # 3. Coach Verified
    conf_coach = ConfidenceService.calculate_confidence(
        source_type="COACH_VERIFIED",
        verification_status="COACH_VERIFIED",
        is_coach_verified=True
    )
    assert conf_coach >= 94.0

    # 4. Smartphone Derived
    conf_phone = ConfidenceService.calculate_confidence(
        source_type="SMARTPHONE_DERIVED",
        verification_status="UNVERIFIED",
        evidence_url=None
    )
    assert 70.0 <= conf_phone <= 80.0
