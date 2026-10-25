"""Best-effort pose-based video analysis for SportIQ's experimental MVP.

Outputs observable pose landmarks and coarse joint-angle summaries only. It does not
claim certified timing, jump distance, injury diagnosis, or competition-grade scores.
"""
from __future__ import annotations

import math
from pathlib import Path
from statistics import mean
from typing import Any


def _angle(a: tuple[float, float], b: tuple[float, float], c: tuple[float, float]) -> float:
    """Return the 2D angle ABC in degrees."""
    ba = (a[0] - b[0], a[1] - b[1])
    bc = (c[0] - b[0], c[1] - b[1])
    denom = math.hypot(*ba) * math.hypot(*bc)
    if denom == 0:
        return float("nan")
    cosine = max(-1.0, min(1.0, (ba[0] * bc[0] + ba[1] * bc[1]) / denom))
    return math.degrees(math.acos(cosine))


def analyze_video(path: str | Path, sport: str, discipline: str = "", max_frames: int = 120) -> dict[str, Any]:
    """Sample frames and summarize visible pose confidence and knee-angle ranges.

    Dependencies are imported lazily so API startup still works if CV packages are
    unavailable. Errors are returned as a non-fatal unavailable status for API callers.
    """
    try:
        import cv2
        import mediapipe as mp
    except ImportError:
        return {
            "status": "awaiting_ai_model",
            "summary": "Pose analysis dependencies are not installed on this server.",
            "metrics": {},
            "limitations": ["No computer-vision metrics were computed."],
        }

    capture = cv2.VideoCapture(str(path))
    if not capture.isOpened():
        return {"status": "analysis_unavailable", "summary": "The uploaded file could not be decoded as a video.", "metrics": {}, "limitations": ["No movement metrics were computed."]}
    fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    duration = frame_count / fps if fps > 0 and frame_count > 0 else None
    sample_step = max(1, frame_count // max_frames) if frame_count else 1
    pose = mp.solutions.pose
    detected = 0
    confidences: list[float] = []
    left_knees: list[float] = []
    right_knees: list[float] = []
    sampled = 0
    index = 0
    try:
        with pose.Pose(static_image_mode=False, model_complexity=1, enable_segmentation=False, min_detection_confidence=0.5, min_tracking_confidence=0.5) as estimator:
            while sampled < max_frames:
                ok, frame = capture.read()
                if not ok:
                    break
                current = index
                index += 1
                if current % sample_step:
                    continue
                sampled += 1
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                result = estimator.process(rgb)
                if not result.pose_landmarks:
                    continue
                detected += 1
                lm = result.pose_landmarks.landmark
                confidences.append(mean([lm[i].visibility for i in (11, 12, 23, 24, 25, 26, 27, 28)]))
                def point(i: int) -> tuple[float, float]:
                    return (lm[i].x, lm[i].y)
                lk = _angle(point(23), point(25), point(27))
                rk = _angle(point(24), point(26), point(28))
                if math.isfinite(lk): left_knees.append(lk)
                if math.isfinite(rk): right_knees.append(rk)
    finally:
        capture.release()

    if sampled == 0:
        return {"status": "analysis_unavailable", "summary": "No readable video frames were found.", "metrics": {}, "limitations": ["No movement metrics were computed."]}
    detection_rate = detected / sampled
    metrics: dict[str, Any] = {
        "sampled_frames": sampled,
        "pose_detected_frames": detected,
        "pose_detection_rate": round(detection_rate, 3),
        "mean_pose_visibility": round(mean(confidences), 3) if confidences else None,
        "video_duration_seconds": round(duration, 2) if duration is not None else None,
        "reported_fps": round(fps, 2) if fps > 0 else None,
    }
    if left_knees:
        metrics["left_knee_angle_range_degrees"] = [round(min(left_knees), 1), round(max(left_knees), 1)]
    if right_knees:
        metrics["right_knee_angle_range_degrees"] = [round(min(right_knees), 1), round(max(right_knees), 1)]
    summary = f"Pose landmarks were detected in {detected} of {sampled} sampled frames ({detection_rate:.0%})."
    if not detected:
        summary += " Try a well-lit, full-body side or front view with the athlete unobstructed."
    limitations = [
        "Experimental 2D pose estimates can be inaccurate with occlusion, camera perspective, low light, or fast motion.",
        "Angles are image-plane estimates and are not calibrated biomechanical measurements.",
        "No validated sprint time, jump distance/height, hurdle clearance score, injury risk, or talent ranking is produced.",
    ]
    return {"status": "pose_metrics_available" if detected else "analysis_unavailable", "summary": summary, "metrics": metrics, "limitations": limitations}
