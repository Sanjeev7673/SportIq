"""Experimental 2D pose measurements for SportIQ video submissions.

These measurements are descriptive computer-vision outputs, not a validated
sports-performance score, medical assessment, or competition-grade biomechanics.
"""
from __future__ import annotations

import math
from pathlib import Path
from statistics import mean
from typing import Any


def _angle(a: tuple[float, float], b: tuple[float, float], c: tuple[float, float]) -> float:
    """Return the angle ABC in degrees using normalized image coordinates."""
    ba = (a[0] - b[0], a[1] - b[1])
    bc = (c[0] - b[0], c[1] - b[1])
    denom = math.hypot(*ba) * math.hypot(*bc)
    if denom <= 1e-9:
        return 0.0
    cosine = max(-1.0, min(1.0, (ba[0] * bc[0] + ba[1] * bc[1]) / denom))
    return math.degrees(math.acos(cosine))


def analyze_video(path: str | Path, sport: str = "", discipline: str = "") -> dict[str, Any]:
    """Sample video frames and return cautious pose visibility/joint-angle metrics."""
    limitations = [
        "Measurements are based on 2D image coordinates and vary with camera angle, framing, lighting, and occlusion.",
        "This prototype does not calculate a validated athletic performance score, speed, force, jump height, or injury risk.",
        "Have a qualified coach review the video and measurements before drawing performance conclusions.",
    ]
    try:
        import cv2
        import mediapipe as mp
    except Exception:
        return {
            "status": "pose_analysis_unavailable",
            "summary": "The video was saved, but pose-analysis dependencies are unavailable on the server.",
            "metrics": {},
            "limitations": limitations,
        }

    capture = cv2.VideoCapture(str(path))
    if not capture.isOpened():
        return {
            "status": "video_read_failed",
            "summary": "The video was saved, but the server could not decode it for pose analysis.",
            "metrics": {},
            "limitations": limitations,
        }

    total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    sample_every = max(1, total_frames // 120) if total_frames > 0 else 1
    sampled = 0
    detected = 0
    visibility_values: list[float] = []
    joint_angles: dict[str, list[float]] = {
        "left_knee_angle_deg": [],
        "right_knee_angle_deg": [],
        "left_elbow_angle_deg": [],
        "right_elbow_angle_deg": [],
    }
    pose = mp.solutions.pose

    try:
        with pose.Pose(static_image_mode=False, model_complexity=1, enable_segmentation=False,
                       min_detection_confidence=0.5, min_tracking_confidence=0.5) as estimator:
            frame_index = 0
            while sampled < 120:
                # grab() advances without decoding/retrieving, so skipped frames stay cheap.
                if not capture.grab():
                    break
                should_sample = frame_index % sample_every == 0
                frame_index += 1
                if not should_sample:
                    continue
                ok, frame = capture.retrieve()
                if not ok or frame is None:
                    continue
                sampled += 1
                height, width = frame.shape[:2]
                if max(height, width) > 640:
                    scale = 640 / max(height, width)
                    frame = cv2.resize(frame, (int(width * scale), int(height * scale)))
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                result = estimator.process(rgb)
                if not result.pose_landmarks:
                    continue
                detected += 1
                landmarks = result.pose_landmarks.landmark
                visibility_values.append(mean(float(p.visibility) for p in landmarks))
                ids = pose.PoseLandmark

                def point(name: str) -> tuple[float, float]:
                    item = landmarks[getattr(ids, name).value]
                    return (float(item.x), float(item.y))

                for key, names in {
                    "left_knee_angle_deg": ("LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"),
                    "right_knee_angle_deg": ("RIGHT_HIP", "RIGHT_KNEE", "RIGHT_ANKLE"),
                    "left_elbow_angle_deg": ("LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"),
                    "right_elbow_angle_deg": ("RIGHT_SHOULDER", "RIGHT_ELBOW", "RIGHT_WRIST"),
                }.items():
                    pts = [point(name) for name in names]
                    joint_angles[key].append(round(_angle(*pts), 1))

    except Exception as exc:
        return {
            "status": "analysis_failed",
            "summary": f"Pose analysis failed ({type(exc).__name__}).",
            "metrics": {},
            "limitations": limitations,
        }
    finally:
        capture.release()

    detection_rate = round((detected / sampled) * 100, 1) if sampled else 0.0
    metrics: dict[str, Any] = {
        "frames_sampled": sampled,
        "frames_with_pose": detected,
        "pose_detection_rate_percent": detection_rate,
        "mean_landmark_visibility": round(mean(visibility_values), 3) if visibility_values else None,
        "sport_label": sport.strip() or "Unspecified",
        "drill_label": discipline.strip() or "Unspecified",
    }
    for name, values in joint_angles.items():
        if values:
            metrics[name] = {
                "mean": round(mean(values), 1),
                "minimum": round(min(values), 1),
                "maximum": round(max(values), 1),
                "samples": len(values),
            }

    if sampled == 0:
        status = "video_read_failed"
        summary = "The video was saved, but no readable frames were found."
    elif detection_rate < 30:
        status = "insufficient_pose_visibility"
        summary = "The video was saved, but a person could not be detected consistently enough for useful pose measurements."
    else:
        status = "pose_metrics_available"
        summary = f"Experimental 2D pose measurements were extracted from {detected} of {sampled} sampled frames. No validated performance score was generated."

    return {"status": status, "summary": summary, "metrics": metrics, "limitations": limitations}
