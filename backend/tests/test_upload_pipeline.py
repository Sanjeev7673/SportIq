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
