import json
import app.gemini_video_review as g

class _Resp:
    def __init__(self, text):
        self.text = text

def _fake_client(monkeypatch, *, text=None, exc=None):
    import google.genai as genai
    class FakeModels:
        def generate_content(self, **kwargs):
            assert kwargs["contents"][0].startswith("You are a cautious")
            assert len(kwargs["contents"]) >= 2
            if exc:
                raise exc
            return _Resp(text)
    class FakeClient:
        def __init__(self, **kwargs):
            self.models = FakeModels()
    monkeypatch.setattr(genai, "Client", FakeClient)
    monkeypatch.setenv("GEMINI_API_KEY", "fake-key-for-tests")

def test_missing_key_reports_not_configured(video_path, monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    r = g.analyze_keyframes_with_gemini(video_path, "Football", "Sprint")
    assert r["status"] == "not_configured" and r["error_code"] == "not_configured"

def test_valid_json_is_sanitised(video_path, monkeypatch):
    payload = {"summary": "  Visible stride.  ", "observations": ["a"] * 9, "recommendations": ["b"] * 9, "limitations": "oops"}
    _fake_client(monkeypatch, text="\x60\x60\x60json\n" + json.dumps(payload) + "\n\x60\x60\x60")
    r = g.analyze_keyframes_with_gemini(video_path, "Football", "Sprint")
    assert r["status"] == "complete" and r["summary"] == "Visible stride."
    assert len(r["observations"]) <= 4 and len(r["recommendations"]) <= 3
    assert r["frames_reviewed"] >= 1

def test_malformed_model_output_is_failed_not_complete(video_path, monkeypatch):
    _fake_client(monkeypatch, text="not json")
    r = g.analyze_keyframes_with_gemini(video_path, "Football", "Sprint")
    assert r["status"] == "failed" and r["error_code"] == "malformed_response"

def test_api_errors_are_classified(video_path, monkeypatch):
    err = Exception("quota exceeded")
    err.code = 429
    _fake_client(monkeypatch, exc=err)
    r = g.analyze_keyframes_with_gemini(video_path, "Football", "Sprint")
    assert r["status"] == "failed" and r["error_code"] == "rate_limited"
    assert "fake-key-for-tests" not in json.dumps(r)

def test_timeout_is_classified(video_path, monkeypatch):
    class ReadTimeout(Exception):
        pass
    _fake_client(monkeypatch, exc=ReadTimeout("request timed out"))
    assert g.analyze_keyframes_with_gemini(video_path, "Football", "Sprint")["error_code"] == "timeout"
