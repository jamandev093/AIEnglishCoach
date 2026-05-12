import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from ai_service import normalize_ai_correction_response_or_fallback  # noqa: E402
from analyzer import analyze_sentence  # noqa: E402
from main import app  # noqa: E402
from schemas import AI_CORRECTION_RESPONSE_KEYS  # noqa: E402


client = TestClient(app)

REQUIRED_SPEECH_KEYS = AI_CORRECTION_RESPONSE_KEYS | {
    "audioFileName",
    "transcribedText",
}


def make_valid_ai_response(**overrides):
    response = {
        "success": True,
        "originalText": "I go market",
        "correctedText": "I went to the market.",
        "improved": "I went to the market.",
        "score": 82,
        "mistakes": ["Wrong tense", "Missing preposition"],
        "simpleExplanation": "Use went for a past action.",
        "teacherExplanation": "Because this happened in the past, use the past tense form went.",
        "smartSuggestion": "Yesterday, I went to the market.",
        "repeatSentence": "I went to the market.",
        "confidenceScore": 80,
        "fluencyScore": 78,
        "pronunciationScore": 84,
        "coachReply": "Good try. Repeat this slowly: I went to the market.",
    }
    response.update(overrides)
    return response


def test_valid_ai_like_output_is_accepted_and_keeps_camel_case_keys():
    result = normalize_ai_correction_response_or_fallback(
        make_valid_ai_response(),
        "I go market",
    )

    assert set(result.keys()) == AI_CORRECTION_RESPONSE_KEYS
    assert all("_" not in key for key in result)
    assert result["correctedText"] == "I went to the market."
    assert result["improved"] == "I went to the market."
    assert result["mistakes"] == ["Wrong tense", "Missing preposition"]


def test_ai_output_cannot_override_backend_original_text():
    result = normalize_ai_correction_response_or_fallback(
        make_valid_ai_response(originalText="Different text"),
        "  I   go   market  ",
    )

    assert result["originalText"] == "I go market"


@pytest.mark.parametrize(
    "missing_key",
    [
        "correctedText",
        "score",
        "mistakes",
        "simpleExplanation",
        "coachReply",
    ],
)
def test_missing_required_ai_fields_fall_back_to_rule(missing_key):
    raw_response = make_valid_ai_response()
    raw_response.pop(missing_key)

    result = normalize_ai_correction_response_or_fallback(
        raw_response,
        "I go market",
    )

    assert result == analyze_sentence("I go market")


def test_snake_case_ai_keys_fall_back_to_rule():
    raw_response = make_valid_ai_response()
    raw_response["corrected_text"] = raw_response.pop("correctedText")

    result = normalize_ai_correction_response_or_fallback(
        raw_response,
        "I go market",
    )

    assert result == analyze_sentence("I go market")


@pytest.mark.parametrize(
    "bad_mistakes",
    [
        "Wrong tense",
        ["Wrong tense", 123],
    ],
)
def test_invalid_mistakes_fall_back_to_rule(bad_mistakes):
    result = normalize_ai_correction_response_or_fallback(
        make_valid_ai_response(mistakes=bad_mistakes),
        "I go market",
    )

    assert result == analyze_sentence("I go market")


def test_score_fields_are_normalized_to_safe_range():
    result = normalize_ai_correction_response_or_fallback(
        make_valid_ai_response(
            score=140,
            confidenceScore=-12,
            fluencyScore=91.6,
            pronunciationScore=99.4,
        ),
        "I go market",
    )

    assert result["score"] == 100
    assert result["confidenceScore"] == 0
    assert result["fluencyScore"] == 92
    assert result["pronunciationScore"] == 99


@pytest.mark.parametrize(
    "score_override",
    [
        {"score": "82"},
        {"confidenceScore": True},
    ],
)
def test_invalid_score_fields_fall_back_to_rule(score_override):
    result = normalize_ai_correction_response_or_fallback(
        make_valid_ai_response(**score_override),
        "I go market",
    )

    assert result == analyze_sentence("I go market")


def test_blank_improved_and_repeat_sentence_normalize_to_corrected_text():
    result = normalize_ai_correction_response_or_fallback(
        make_valid_ai_response(
            improved=" ",
            repeatSentence="",
        ),
        "I go market",
    )

    assert result["improved"] == "I went to the market."
    assert result["repeatSentence"] == "I went to the market."


def test_empty_corrected_text_falls_back_to_rule():
    result = normalize_ai_correction_response_or_fallback(
        make_valid_ai_response(correctedText=" "),
        "I go market",
    )

    assert result == analyze_sentence("I go market")


def test_non_json_object_ai_output_falls_back_to_rule():
    result = normalize_ai_correction_response_or_fallback(
        "not a json object",
        "I go market",
    )

    assert result == analyze_sentence("I go market")


def test_analyze_endpoint_contract_still_passes():
    response = client.post("/analyze", json={"text": "I go market"})

    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) == AI_CORRECTION_RESPONSE_KEYS
    assert data["correctedText"] == "I went to the market."


def test_speech_endpoint_contract_still_includes_speech_fields():
    response = client.post(
        "/speech/analyze",
        data={"simulatedText": "I learning English"},
        files={"file": ("sample.wav", b"fake audio", "audio/wav")},
    )

    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) == REQUIRED_SPEECH_KEYS
    assert data["audioFileName"] == "sample.wav"
    assert data["transcribedText"] == "I learning English"
    assert data["correctedText"] == "I am learning English."
