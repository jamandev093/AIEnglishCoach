import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import ai_service  # noqa: E402
import provider_registry  # noqa: E402
import settings  # noqa: E402
import speech_service  # noqa: E402
from analyzer import analyze_sentence  # noqa: E402
from main import app  # noqa: E402


client = TestClient(app)

REQUIRED_ANALYZE_KEYS = {
    "success",
    "originalText",
    "correctedText",
    "improved",
    "score",
    "mistakes",
    "simpleExplanation",
    "teacherExplanation",
    "smartSuggestion",
    "repeatSentence",
    "confidenceScore",
    "fluencyScore",
    "pronunciationScore",
    "coachReply",
}

REQUIRED_SPEECH_KEYS = REQUIRED_ANALYZE_KEYS | {
    "audioFileName",
    "transcribedText",
}


def test_ai_mode_default_is_rule():
    assert settings.AI_MODE == "rule"
    assert provider_registry.resolve_ai_mode("unsupported") == "rule"


def test_ai_mode_rule_returns_current_analyzer_output(monkeypatch):
    monkeypatch.setattr(ai_service, "AI_MODE", "rule")

    result = ai_service.improve_text_with_ai_or_rule("I go market")

    assert result == analyze_sentence("I go market")
    assert result["correctedText"] == "I went to the market."


def test_ai_mode_open_source_safely_falls_back_to_rule_output(monkeypatch):
    monkeypatch.setattr(ai_service, "AI_MODE", "open_source")

    result = ai_service.improve_text_with_ai_or_rule("I learning English")

    assert result == analyze_sentence("I learning English")
    assert result["correctedText"] == "I am learning English."


def test_ai_mode_openai_safely_falls_back_without_api_key(monkeypatch):
    monkeypatch.setattr(ai_service, "AI_MODE", "openai")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    result = ai_service.improve_text_with_ai_or_rule("I go market")

    assert result == analyze_sentence("I go market")
    assert result["correctedText"] == "I went to the market."


def test_unsupported_ai_mode_safely_falls_back_to_rule_output(monkeypatch):
    monkeypatch.setattr(ai_service, "AI_MODE", "unsupported")

    result = ai_service.improve_text_with_ai_or_rule("I go market")

    assert result == analyze_sentence("I go market")
    assert result["correctedText"] == "I went to the market."


def test_analyze_keeps_required_camel_case_keys(monkeypatch):
    monkeypatch.setattr(ai_service, "AI_MODE", "rule")

    response = client.post("/analyze", json={"text": "I go market"})

    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) == REQUIRED_ANALYZE_KEYS
    assert data["correctedText"] == "I went to the market."


@pytest.mark.parametrize("ai_mode", ["rule", "open_source", "openai", "unsupported"])
def test_fake_stt_works_with_all_ai_modes_and_keeps_speech_fields(
    monkeypatch,
    ai_mode,
):
    monkeypatch.setattr(ai_service, "AI_MODE", ai_mode)
    monkeypatch.setattr(speech_service, "STT_MODE", "fake")

    response = client.post(
        "/speech/analyze",
        files={"file": ("sample.wav", b"fake audio", "audio/wav")},
    )

    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) == REQUIRED_SPEECH_KEYS
    assert data["audioFileName"] == "sample.wav"
    assert data["transcribedText"] == "I go market"
    assert data["correctedText"] == "I went to the market."
