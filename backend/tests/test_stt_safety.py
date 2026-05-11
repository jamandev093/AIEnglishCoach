import sys
from pathlib import Path

from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import settings  # noqa: E402
import speech_service  # noqa: E402
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


def assert_required_analyze_keys(response_data):
    missing_keys = REQUIRED_ANALYZE_KEYS - response_data.keys()
    assert missing_keys == set()


def post_speech_analyze(data=None):
    return client.post(
        "/speech/analyze",
        data=data or {},
        files={"file": ("sample.wav", b"fake audio", "audio/wav")},
    )


def test_stt_mode_default_is_fake():
    assert settings.STT_MODE == "fake"


def test_fake_stt_returns_fake_transcription_without_simulated_text(monkeypatch):
    monkeypatch.setattr(speech_service, "STT_MODE", "fake")

    response = post_speech_analyze()

    assert response.status_code == 200
    data = response.json()
    assert data["audioFileName"] == "sample.wav"
    assert data["transcribedText"] == "I go market"
    assert data["correctedText"] == "I went to the market."


def test_simulated_text_wins_over_fake_stt(monkeypatch):
    monkeypatch.setattr(speech_service, "STT_MODE", "fake")

    response = post_speech_analyze(data={"simulatedText": "I learning English"})

    assert response.status_code == 200
    data = response.json()
    assert data["transcribedText"] == "I learning English"
    assert data["correctedText"] == "I am learning English."


def test_speech_response_keeps_required_contract_keys(monkeypatch):
    monkeypatch.setattr(speech_service, "STT_MODE", "fake")

    response = post_speech_analyze(data={"simulatedText": "I learning English"})

    assert response.status_code == 200
    data = response.json()
    assert_required_analyze_keys(data)
    assert data["audioFileName"] == "sample.wav"
    assert data["transcribedText"] == "I learning English"


def test_fake_stt_does_not_require_api_keys(monkeypatch):
    monkeypatch.setattr(speech_service, "STT_MODE", "fake")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("AZURE_SPEECH_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)

    response = post_speech_analyze()

    assert response.status_code == 200
    data = response.json()
    assert data["transcribedText"] == "I go market"
