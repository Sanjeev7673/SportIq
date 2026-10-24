from typing import Dict, Optional
import numpy as np


class ConfidenceService:
    """
    Data Validation and Confidence Engine.
    Evaluates evidence quality, source authenticity, protocol adherence, and physiological plausibility
    to produce a transparent Data Confidence Score (0 - 100%).

    Core Principle: Device ownership NEVER directly affects Talent Score.
    """

    BASE_CONFIDENCE = {
        "COACH_VERIFIED": 92.0,
        "WEARABLE_DEVICE": 82.0,
        "SMARTPHONE_DERIVED": 75.0,
        "STANDARDIZED_FIELD_TEST": 68.0,
        "SELF_REPORTED_MANUAL": 40.0,
    }

    @classmethod
    def calculate_confidence(
        cls,
        source_type: str,
        verification_status: str = "UNVERIFIED",
        evidence_url: Optional[str] = None,
        field_test_protocol: Optional[str] = None,
        speed: float = 50.0,
        stamina: float = 50.0,
        strength: float = 50.0,
        agility: float = 50.0,
        accuracy: float = 50.0,
        is_coach_verified: bool = False
    ) -> float:
        # 1. Base source confidence
        base = cls.BASE_CONFIDENCE.get(source_type.upper(), 50.0)

        # 2. Evidence attachment bonus (Video / Photo / Sensor Log)
        has_evidence = bool(evidence_url and len(evidence_url.strip()) > 0)
        evidence_bonus = 0.0
        if has_evidence:
            if source_type.upper() == "STANDARDIZED_FIELD_TEST":
                evidence_bonus = 20.0  # Field test + Video evidence yields 88% confidence
            elif source_type.upper() == "SELF_REPORTED_MANUAL":
                evidence_bonus = 25.0  # Self-reported + Video evidence yields 65% confidence
            elif source_type.upper() == "SMARTPHONE_DERIVED":
                evidence_bonus = 12.0
            else:
                evidence_bonus = 5.0

        # 3. Protocol bonus for recognized standardized tests (e.g. 30m Sprint, Beep Test)
        protocol_bonus = 0.0
        if field_test_protocol and len(field_test_protocol.strip()) > 0:
            protocol_bonus = 5.0

        score = base + evidence_bonus + protocol_bonus

        # 4. Independent Verification Overrides
        if is_coach_verified or verification_status.upper() == "COACH_VERIFIED":
            score = max(score, 94.0)
        elif verification_status.upper() == "AI_VIDEO_VERIFIED":
            score = max(score, 88.0)
        elif verification_status.upper() == "SYSTEM_VALIDATED":
            score = max(score, 80.0)

        # 5. Physiological Plausibility & Statistical Variance Checks
        metrics = [speed, stamina, strength, agility, accuracy]
        # Check for extreme anomalies in unverified manual entries (e.g. perfect 100 on everything without proof)
        if not is_coach_verified and not has_evidence:
            if all(m >= 95.0 for m in metrics):
                score -= 15.0  # Suspicious unverified perfection penalty
            elif max(metrics) - min(metrics) > 70.0:
                score -= 8.0   # Extreme disparity penalty

        # Clamp between 15.0% and 99.0%
        final_confidence = round(float(np.clip(score, 15.0, 99.0)), 1)
        return final_confidence
