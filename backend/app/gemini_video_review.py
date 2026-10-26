"""Optional Gemini vision review for sampled frames from a sports video.

Requires GEMINI_API_KEY in the backend environment. The model only comments on
visible technique and uncertainty; it must not invent numerical performance scores
or provide medical/injury diagnoses.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any


def analyze_keyframes_with_gemini(path: str | Path, sport: str, discipline: str) -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return {
            "status": "not_configured",
            "summary": "AI coach review is not configured. Add GEMINI_API_KEY to the backend environment.",
            "observations": [],
            "recommendations": [],
            "confidence_note": "No Gemini vision review was run.",
        }

    try:
        import cv2
        from PIL import Image
        from google import genai
    except Exception as exc:
        return {
            "status": "model_unavailable",
            "summary": "Gemini review could not start because a required server dependency is unavailable.",
            "observations": [],
            "recommendations": [],
            "confidence_note": type(exc).__name__,
        }

    capture = cv2.VideoCapture(str(path))
    if not capture.isOpened():
        return {
            "status": "video_read_failed",
            "summary": "Gemini review could not read the uploaded video.",
            "observations": [],
            "recommendations": [],
            "confidence_note": "Video decoder could not open the file.",
        }

    frames = []
    try:
        total = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        if total <= 0:
            total = 1
        # Select up to six evenly spaced frames across the clip.
        indices = sorted(set(round(i * max(0, total - 1) / 5) for i in range(6)))
        for index in indices:
            capture.set(cv2.CAP_PROP_POS_FRAMES, index)
            ok, frame = capture.read()
            if not ok:
                continue
            height, width = frame.shape[:2]
            scale = min(1.0, 768 / max(height, width))
            if scale < 1:
                frame = cv2.resize(frame, (int(width * scale), int(height * scale)))
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(Image.fromarray(frame))
    finally:
        capture.release()

    if not frames:
        return {
            "status": "video_read_failed",
            "summary": "No readable frames were available for Gemini review.",
            "observations": [],
            "recommendations": [],
            "confidence_note": "No frames could be decoded.",
        }

    prompt = f"""You are a cautious sports video technique assistant reviewing sampled still frames.
Sport: {sport or 'unspecified'}
Activity/drill: {discipline or 'unspecified'}
The images are selected frames from one video, not a continuous clip. Do not infer events that cannot be seen.
Return ONLY valid JSON with keys:
summary (1-3 concise sentences describing only visible evidence),
observations (array of up to 4 specific visible technique observations),
recommendations (array of up to 3 practical coaching cues tied to the visible evidence),
limitations (array explaining uncertainty caused by still-frame sampling, camera angle, occlusion, or missing context).
Do not invent measurements, timing, speed, strength, scores, identity, injury risks, or medical conclusions. If evidence is insufficient, say so. Avoid generic praise and do not claim to have seen motion between frames."""

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=os.getenv("GEMINI_VISION_MODEL", "gemini-2.5-flash"),
            contents=[prompt, *frames],
            config={"response_mime_type": "application/json", "temperature": 0.2},
        )
        raw = (response.text or "").strip()
        parsed = json.loads(raw)
        if not isinstance(parsed, dict):
            raise ValueError("Model response was not a JSON object")
        def clean_list(key: str, limit: int) -> list[str]:
            value = parsed.get(key, [])
            if not isinstance(value, list):
                return []
            return [str(item).strip()[:500] for item in value if str(item).strip()][:limit]
        summary = str(parsed.get("summary", "")).strip()[:2000]
        if not summary:
            raise ValueError("Model response did not include a summary")
        return {
            "status": "complete",
            "model": os.getenv("GEMINI_VISION_MODEL", "gemini-2.5-flash"),
            "frames_reviewed": len(frames),
            "summary": summary,
            "observations": clean_list("observations", 4),
            "recommendations": clean_list("recommendations", 3),
            "limitations": clean_list("limitations", 5),
            "confidence_note": "Qualitative AI review of sampled still frames; not a validated biomechanics assessment.",
        }
    except Exception as exc:
        return {
            "status": "failed",
            "summary": "Gemini vision review failed. The report retains only any available computer-vision measurements.",
            "observations": [],
            "recommendations": [],
            "limitations": [],
            "confidence_note": f"Gemini request failed ({type(exc).__name__}). Check the API key, model access, quota, and backend logs.",
        }
