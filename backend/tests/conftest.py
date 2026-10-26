import os
import sys
import tempfile
from pathlib import Path

os.environ["SPORTIQ_DATA_DIR"] = tempfile.mkdtemp(prefix="sportiq-test-")
os.environ["JWT_SECRET_KEY"] = "test-secret-not-for-production"
os.environ.pop("GEMINI_API_KEY", None)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

@pytest.fixture(scope="session")
def client():
    from app.main import app
    return TestClient(app)

@pytest.fixture(scope="session")
def video_path(tmp_path_factory):
    """Small synthetic, decodable MP4 without a person in it."""
    path = tmp_path_factory.mktemp("vid") / "clip.mp4"
    writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"mp4v"), 15, (320, 240))
    if not writer.isOpened():
        pytest.skip("OpenCV MP4 writer unavailable in this environment")
    for i in range(30):
        frame = np.zeros((240, 320, 3), np.uint8)
        cv2.rectangle(frame, (i * 5, 50), (i * 5 + 40, 200), (255, 255, 255), -1)
        writer.write(frame)
    writer.release()
    return path

@pytest.fixture()
def auth(client):
    import secrets
    email = f"{secrets.token_hex(4)}@example.com"
    r = client.post("/api/v1/auth/register", json={"name": "Test Athlete", "email": email, "password": "password123"})
    assert r.status_code in (200, 201), r.text
    login = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    assert login.status_code == 200, login.text
    return {"Authorization": f"Bearer {login.json()['access_token']}"}

POSE_OK = {
    "status": "pose_metrics_available",
    "summary": "Experimental 2D pose measurements were extracted.",
    "metrics": {"frames_sampled": 10, "frames_with_pose": 9, "pose_detection_rate_percent": 90.0,
                "left_knee_angle_deg": {"mean": 120.0, "minimum": 80.0, "maximum": 170.0, "samples": 9}},
    "limitations": ["2D only."],
}
AI_OK = {"status": "complete", "summary": "Visible stride.", "observations": ["o1"], "recommendations": ["r1"], "limitations": ["l1"]}
AI_RATE = {"status": "failed", "error_code": "rate_limited", "summary": "Gemini vision review failed. quota.", "observations": [], "recommendations": []}
