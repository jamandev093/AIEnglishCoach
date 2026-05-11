import sys
from pathlib import Path

from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

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


def test_analyze_i_go_market_contract():
    response = client.post("/analyze", json={"text": "I go market"})

    assert response.status_code == 200
    data = response.json()
    assert_required_analyze_keys(data)
    assert data["correctedText"] == "I went to the market."


def test_analyze_i_learning_english_contract():
    response = client.post("/analyze", json={"text": "I learning English"})

    assert response.status_code == 200
    data = response.json()
    assert_required_analyze_keys(data)
    assert data["correctedText"] == "I am learning English."


def test_speech_analyze_simulated_text_contract():
    response = client.post(
        "/speech/analyze",
        data={"simulatedText": "I learning English"},
        files={"file": ("sample.wav", b"fake audio", "audio/wav")},
    )

    assert response.status_code == 200
    data = response.json()
    assert_required_analyze_keys(data)
    assert data["audioFileName"] == "sample.wav"
    assert data["transcribedText"] == "I learning English"
    assert data["correctedText"] == "I am learning English."
