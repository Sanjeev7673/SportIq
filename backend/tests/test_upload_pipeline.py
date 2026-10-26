import os

from tests.conftest import POSE_OK, AI_OK, AI_RATE

def _upload(client, auth, path, name="clip.mp4", ctype="video/mp4", sport="Football"):
    with open(path, "rb") as f:
        return client.post("/api/v1/athletes/me/videos", headers=auth,
                           data={"sport": sport, "discipline": "Sprint"},
                           files={"video": (name, f, ctype)})

def _patch(monkeypatch, pose, ai):
    import app.gemini_video_review as g
    import app.sport_analysis as sa
    monkeypatch.setattr(sa, "analyze_video", lambda *a, **k: dict(pose))
    monkeypatch.setattr(g, "analyze_keyframes_with_gemini", lambda *a, **k: dict(ai))

def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "healthy"

def test_upload_requires_auth(client, video_path):
    with open(video_path, "rb") as f:
        r = client.post("/api/v1/athletes/me/videos", data={"sport": "Football"},
                        files={"video": ("c.mp4", f, "video/mp4")})
    assert r.status_code == 401

def test_rejects_unsupported_type(client, auth, tmp_path):
    bad = tmp_path / "x.txt"
    bad.write_bytes(b"hello")
    assert _upload(client, auth, bad, "x.txt", "text/plain").status_code == 415

def test_full_success_saves_report_with_truthful_status_and_pdf(client, auth, video_path, monkeypatch):
    _patch(monkeypatch, POSE_OK, AI_OK)
    r = _upload(client, auth, video_path)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["report_status"]["overall"] == "complete"
    rep_response = client.get(f"/api/v1/reports/{body['report_id']}", headers=auth)
    assert rep_response.status_code == 200
    rep = rep_response.json()["report"]
    assert rep["analysis_metrics"]["ai_coach_review"]["observations"] == ["o1"]
    assert rep["analysis_metrics"]["report_status"]["ai_review"] == "complete"
    assert client.get(f"/api/v1/reports/{body['report_id']}/pdf", headers=auth).headers["content-type"] == "application/pdf"
    assert len(client.get("/api/v1/reports", headers=auth).json()["reports"]) == 1

def test_gemini_failure_is_not_reported_as_complete_and_keeps_pose_metrics(client, auth, video_path, monkeypatch):
    _patch(monkeypatch, POSE_OK, AI_RATE)
    body = _upload(client, auth, video_path).json()
    assert body["report_status"]["overall"] == "partial_pose_only"
    rep = client.get(f"/api/v1/reports/{body['report_id']}", headers=auth).json()["report"]
    assert rep["analysis_metrics"]["left_knee_angle_deg"]["mean"] == 120.0
    assert "quota" in rep["improvements"]

def test_report_with_no_metrics_still_renders_pdf(client, auth, video_path, monkeypatch):
    _patch(monkeypatch, {"status": "pose_analysis_unavailable", "summary": "deps missing", "metrics": {}, "limitations": []},
           {"status": "not_configured", "summary": "not configured", "observations": [], "recommendations": []})
    body = _upload(client, auth, video_path).json()
    assert body["report_status"]["overall"] == "analysis_incomplete"
    assert client.get(f"/api/v1/reports/{body['report_id']}/pdf", headers=auth).status_code == 200

def test_reports_are_private_to_their_owner(client, auth, video_path, monkeypatch):
    _patch(monkeypatch, POSE_OK, AI_OK)
    rid = _upload(client, auth, video_path).json()["report_id"]
    client.post("/api/v1/auth/register", json={"name": "Other Person", "email": "other-owner@example.com", "password": "password123"})
    token = client.post("/api/v1/auth/login", json={"email": "other-owner@example.com", "password": "password123"}).json()["access_token"]
    assert client.get(f"/api/v1/reports/{rid}", headers={"Authorization": f"Bearer {token}"}).status_code == 404

def test_corrupt_stored_metrics_do_not_break_report_listing():
    from app.main import load_metrics
    assert load_metrics("{not json") == {} and load_metrics(None) == {} and load_metrics("[1]") == {}

def test_overall_status_matrix():
    from app.main import overall_report_status
    assert overall_report_status("pose_metrics_available", "complete") == "complete"
    assert overall_report_status("pose_metrics_available", "failed") == "partial_pose_only"
    assert overall_report_status("insufficient_pose_visibility", "complete") == "partial_ai_only"
    assert overall_report_status("insufficient_pose_visibility", "not_configured") == "analysis_incomplete"


# ---- additional failure-path coverage -------------------------------------------------


def _files_in_upload_dir():
    from app.main import UPLOAD_DIR
    return set(os.listdir(UPLOAD_DIR))


def test_empty_file_returns_400_and_leaves_nothing_behind(client, auth, tmp_path):
    before = _files_in_upload_dir()
    empty = tmp_path / "empty.mp4"
    empty.write_bytes(b"")
    r = _upload(client, auth, empty, "empty.mp4")
    assert r.status_code == 400 and "empty" in r.json()["detail"].lower()
    assert _files_in_upload_dir() == before


def test_oversize_file_returns_413_and_is_removed(client, auth, tmp_path, monkeypatch):
    import app.main as m
    monkeypatch.setattr(m, "MAX_VIDEO_MB", 1)
    before = _files_in_upload_dir()
    big = tmp_path / "big.mp4"
    big.write_bytes(b"\\0" * (1024 * 1024 + 10))
    r = _upload(client, auth, big, "big.mp4")
    assert r.status_code == 413 and "1 MB" in r.json()["detail"]
    assert _files_in_upload_dir() == before


def test_invalid_or_missing_token_is_rejected(client, video_path):
    with open(video_path, "rb") as f:
        r = client.post("/api/v1/athletes/me/videos", headers={"Authorization": "Bearer not-a-token"}, data={"sport": "Football"}, files={"video": ("c.mp4", f, "video/mp4")})
    assert r.status_code == 401
    assert client.get("/api/v1/reports").status_code == 401


def test_non_athlete_cannot_upload(client, video_path):
    client.post("/api/v1/auth/register", json={"name": "Coach Person", "email": "coach-upload@example.com", "password": "password123", "role": "COACH"})
    tok = client.post("/api/v1/auth/login", json={"email": "coach-upload@example.com", "password": "password123"}).json()["access_token"]
    assert _upload(client, {"Authorization": f"Bearer {tok}"}, video_path).status_code == 403


def test_video_without_a_person_is_saved_as_limited_not_complete(client, auth, video_path):
    """Uses real OpenCV + MediaPipe on a synthetic clip with no person (no mocks)."""
    r = _upload(client, auth, video_path)
    assert r.status_code == 201
    body = r.json()
    assert body["analysis_status"] == "insufficient_pose_visibility"
    assert body["report_status"]["overall"] == "analysis_incomplete"
    assert body["analysis"]["metrics"]["frames_with_pose"] == 0


def test_analysis_failed_status_returns_422_and_cleans_up(client, auth, video_path, monkeypatch):
    from tests.conftest import AI_OK
    _patch(monkeypatch, {"status": "analysis_failed", "summary": "Pose analysis failed (RuntimeError).", "metrics": {}, "limitations": []}, AI_OK)
    before = _files_in_upload_dir()
    assert _upload(client, auth, video_path).status_code == 422
    assert _files_in_upload_dir() == before


def test_unexpected_exception_returns_generic_500_without_leaking_details_and_cleans_up(client, auth, video_path, monkeypatch):
    import app.sport_analysis as sa
    def boom(*a, **k):
        raise RuntimeError("secret /srv/path/leak")
    monkeypatch.setattr(sa, "analyze_video", boom)
    before = _files_in_upload_dir()
    r = _upload(client, auth, video_path)
    assert r.status_code == 500
    assert "secret" not in r.text and "/srv/path" not in r.text
    assert _files_in_upload_dir() == before


def test_database_failure_during_save_cleans_up_file(client, auth, video_path, monkeypatch):
    from tests.conftest import POSE_OK, AI_OK
    from sqlalchemy.orm import Session
    _patch(monkeypatch, POSE_OK, AI_OK)
    def fail_commit(self):
        raise RuntimeError("db down")
    monkeypatch.setattr(Session, "commit", fail_commit)
    before = _files_in_upload_dir()
    r = _upload(client, auth, video_path)
    assert r.status_code == 500
    assert _files_in_upload_dir() == before
