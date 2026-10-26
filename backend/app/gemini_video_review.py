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



def _classify_error(exc: Exception) -> tuple[str, str]:
    """Classify model/network failures without exposing secrets or request content."""
    name = type(exc).__name__
    code = getattr(exc, "code", None)
    message = str(exc).lower()
    if isinstance(exc, (json.JSONDecodeError, ValueError)):
        return "malformed_response", "The model returned output that was not valid review JSON."
    if code in (401, 403) or "api key" in message or "api_key_invalid" in message or "permission" in message:
        return "invalid_api_key", "Gemini rejected the API key or the key lacks access. Check GEMINI_API_KEY."
    if code == 429 or "resource_exhausted" in message or "quota" in message:
        return "rate_limited", "Gemini quota or rate limit reached. Try again later."
    if code == 404 or "not found" in message:
        return "model_unavailable", "The configured Gemini model is unavailable. Check GEMINI_VISION_MODEL."
    if "timeout" in name.lower() or "timed out" in message or "timeout" in message:
        return "timeout", "The Gemini request timed out."
    if name in ("ConnectError", "ConnectTimeout", "ReadError", "RemoteProtocolError") or "connect" in message:
        return "network_error", "The server could not reach the Gemini API."
    try:
        if code is not None and int(code) >= 500:
            return "model_unavailable", "Gemini reported a server-side error. Try again later."
    except (TypeError, ValueError):
        pass
    return "unknown_error", f"Unexpected Gemini failure ({name})."

def _strip_json_fences(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.strip("`").strip()
        if raw.lower().startswith("json"):
            raw = raw[4:].strip()
    return raw

def analyze_keyframes_with_gemini(path: str | Path, sport: str, discipline: str) -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return {
            "status": "not_configured",
            "error_code": "not_configured",
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
        print(f"Gemini dependencies unavailable: {type(exc).__name__}", flush=True)
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
        from google.genai import types as genai_types
        timeout_ms = max(1, int(os.getenv("GEMINI_TIMEOUT_SECONDS", "60"))) * 1000
        client = genai.Client(api_key=api_key, http_options=genai_types.HttpOptions(timeout=timeout_ms))
        response = client.models.generate_content(
            model=os.getenv("GEMINI_VISION_MODEL", "gemini-2.5-flash"),
            contents=[prompt, *frames],
            config={"response_mime_type": "application/json", "temperature": 0.2},
        )
        raw = _strip_json_fences(response.text or "")
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
        error_code, hint = _classify_error(exc)
        print(f"Gemini review failed: {type(exc).__name__} ({error_code})", flush=True)
        return {
            "status": "failed",
            "error_code": error_code,
            "summary": f"Gemini vision review failed. {hint} The report retains only any available computer-vision measurements.",
            "observations": [],
            "recommendations": [],
            "limitations": [],
            "confidence_note": f"Gemini request failed ({type(exc).__name__}, {error_code}).",
        }
