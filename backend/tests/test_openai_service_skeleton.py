import sys
from pathlib import Path

import pytest


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import ai_service  # noqa: E402
from analyzer import analyze_sentence  # noqa: E402
from schemas import AI_CORRECTION_RESPONSE_KEYS  # noqa: E402


def make_valid_ai_response(**overrides):
    response = {
        "success": True,
        "originalText": "I go market",
        "correctedText": "I went to the market.",
        "improved": "I went to the market.",
        "score": 82,
        "mistakes": ["Wrong tense", "Missing preposition"],
        "simpleExplanation": "Use went for a past action.",
        "teacherExplanation": "Because this happened in the past, use went.",
        "smartSuggestion": "Yesterday, I went to the market.",
        "repeatSentence": "I went to the market.",
        "confidenceScore": 80,
        "fluencyScore": 78,
        "pronunciationScore": 84,
        "coachReply": "Good try. Repeat this slowly: I went to the market.",
    }
    response.update(overrides)
    return response


def fail_if_openai_sender_runs(_payload):
    pytest.fail("OpenAI sender placeholder should not be reached")


def fail_if_prompt_builder_runs(_text):
    pytest.fail("OpenAI prompt builder should not be reached")


def enable_openai_guards(monkeypatch):
    monkeypatch.setattr(ai_service, "AI_MODE", "openai")
    monkeypatch.setattr(ai_service, "AI_ENABLE_PAID_CALLS", True)
    monkeypatch.setattr(ai_service, "OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(ai_service, "OPENAI_TEXT_MODEL", "test-model")
    monkeypatch.setattr(ai_service, "AI_TIMEOUT_SECONDS", 8)
    monkeypatch.setattr(ai_service, "AI_MAX_INPUT_CHARS", 1000)


def test_default_rule_mode_does_not_call_openai_sender(monkeypatch):
    monkeypatch.setattr(
        ai_service,
        "send_openai_correction_request",
        fail_if_openai_sender_runs,
    )

    result = ai_service.improve_text_with_ai_or_rule("I go market")

    assert result == analyze_sentence("I go market")


def test_openai_skeleton_returns_rule_when_mode_is_not_openai(monkeypatch):
    monkeypatch.setattr(ai_service, "AI_MODE", "rule")
    monkeypatch.setattr(
        ai_service,
        "build_ai_correction_messages",
        fail_if_prompt_builder_runs,
    )
    monkeypatch.setattr(
        ai_service,
        "send_openai_correction_request",
        fail_if_openai_sender_runs,
    )

    result = ai_service.improve_text_with_openai_placeholder("I go market")

    assert result == analyze_sentence("I go market")


def test_openai_skeleton_does_not_build_prompt_when_paid_calls_disabled(
    monkeypatch,
):
    monkeypatch.setattr(ai_service, "AI_MODE", "openai")
    monkeypatch.setattr(ai_service, "AI_ENABLE_PAID_CALLS", False)
    monkeypatch.setattr(ai_service, "OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(
        ai_service,
        "build_ai_correction_messages",
        fail_if_prompt_builder_runs,
    )

    result = ai_service.improve_text_with_ai_or_rule("I go market")

    assert result == analyze_sentence("I go market")


def test_openai_skeleton_does_not_build_prompt_without_api_key(monkeypatch):
    monkeypatch.setattr(ai_service, "AI_MODE", "openai")
    monkeypatch.setattr(ai_service, "AI_ENABLE_PAID_CALLS", True)
    monkeypatch.setattr(ai_service, "OPENAI_API_KEY", "")
    monkeypatch.setattr(
        ai_service,
        "build_ai_correction_messages",
        fail_if_prompt_builder_runs,
    )

    result = ai_service.improve_text_with_ai_or_rule("I go market")

    assert result == analyze_sentence("I go market")


@pytest.mark.parametrize("text", ["", "x" * 11])
def test_openai_skeleton_does_not_build_prompt_for_empty_or_too_long_input(
    monkeypatch,
    text,
):
    enable_openai_guards(monkeypatch)
    monkeypatch.setattr(ai_service, "AI_MAX_INPUT_CHARS", 10)
    monkeypatch.setattr(
        ai_service,
        "build_ai_correction_messages",
        fail_if_prompt_builder_runs,
    )

    result = ai_service.improve_text_with_ai_or_rule(text)

    assert result == analyze_sentence(text)


def test_openai_request_payload_uses_prompt_templates_and_model_config(
    monkeypatch,
):
    messages = [
        {"role": "system", "content": "system prompt"},
        {"role": "user", "content": "user prompt"},
    ]
    monkeypatch.setattr(ai_service, "OPENAI_TEXT_MODEL", "test-model")
    monkeypatch.setattr(ai_service, "AI_TIMEOUT_SECONDS", 9)
    monkeypatch.setattr(ai_service, "OPENAI_MAX_OUTPUT_TOKENS", 321)
    monkeypatch.setattr(
        ai_service,
        "build_ai_correction_messages",
        lambda text: messages,
    )

    payload = ai_service.build_openai_correction_request_payload("I go market")

    assert payload["model"] == "test-model"
    assert payload["input"] == messages
    assert payload["timeout"] == 9
    assert payload["max_output_tokens"] == 321
    assert payload["text"]["format"]["type"] == "json_object"


def test_openai_skeleton_can_accept_mocked_valid_provider_json(monkeypatch):
    enable_openai_guards(monkeypatch)
    captured_payload = {}

    def fake_sender(payload):
        captured_payload.update(payload)
        return make_valid_ai_response()

    monkeypatch.setattr(
        ai_service,
        "send_openai_correction_request",
        fake_sender,
    )

    result = ai_service.improve_text_with_ai_or_rule("I go market")

    assert captured_payload["model"] == "test-model"
    assert captured_payload["input"][0]["role"] == "system"
    assert captured_payload["input"][1]["role"] == "user"
    assert set(result.keys()) == AI_CORRECTION_RESPONSE_KEYS
    assert result["correctedText"] == "I went to the market."


def test_openai_sender_parses_mocked_responses_api_output(monkeypatch):
    enable_openai_guards(monkeypatch)
    captured_payload = {}

    def fake_post(payload):
        captured_payload.update(payload)
        return {
            "output": [
                {
                    "type": "message",
                    "content": [
                        {
                            "type": "output_text",
                            "text": ai_service.json.dumps(make_valid_ai_response()),
                        }
                    ],
                }
            ]
        }

    monkeypatch.setattr(ai_service, "post_openai_responses_request", fake_post)

    result = ai_service.improve_text_with_ai_or_rule("I go market")

    assert captured_payload["model"] == "test-model"
    assert result["correctedText"] == "I went to the market."
    assert set(result.keys()) == AI_CORRECTION_RESPONSE_KEYS


def test_openai_sender_parses_mocked_output_text(monkeypatch):
    enable_openai_guards(monkeypatch)
    monkeypatch.setattr(
        ai_service,
        "post_openai_responses_request",
        lambda payload: {"output_text": ai_service.json.dumps(make_valid_ai_response())},
    )

    result = ai_service.improve_text_with_ai_or_rule("I go market")

    assert result["correctedText"] == "I went to the market."


def test_openai_skeleton_sender_exception_falls_back_to_rule(monkeypatch):
    enable_openai_guards(monkeypatch)

    def fake_sender(_payload):
        raise TimeoutError("simulated timeout")

    monkeypatch.setattr(
        ai_service,
        "send_openai_correction_request",
        fake_sender,
    )

    result = ai_service.improve_text_with_ai_or_rule("I go market")

    assert result == analyze_sentence("I go market")


def test_openai_skeleton_invalid_provider_json_falls_back_to_rule(monkeypatch):
    enable_openai_guards(monkeypatch)
    monkeypatch.setattr(
        ai_service,
        "send_openai_correction_request",
        lambda payload: {"success": True},
    )

    result = ai_service.improve_text_with_ai_or_rule("I go market")

    assert result == analyze_sentence("I go market")


def test_openai_http_error_falls_back_to_rule(monkeypatch):
    enable_openai_guards(monkeypatch)

    def fake_post(_payload):
        raise ai_service.httpx.HTTPError("simulated http failure")

    monkeypatch.setattr(ai_service, "post_openai_responses_request", fake_post)

    result = ai_service.improve_text_with_ai_or_rule("I go market")

    assert result == analyze_sentence("I go market")


def test_openai_malformed_json_falls_back_to_rule(monkeypatch):
    enable_openai_guards(monkeypatch)
    monkeypatch.setattr(
        ai_service,
        "post_openai_responses_request",
        lambda payload: {"output_text": "not json"},
    )

    result = ai_service.improve_text_with_ai_or_rule("I go market")

    assert result == analyze_sentence("I go market")


def test_openai_missing_output_text_falls_back_to_rule(monkeypatch):
    enable_openai_guards(monkeypatch)
    monkeypatch.setattr(
        ai_service,
        "post_openai_responses_request",
        lambda payload: {"output": []},
    )

    result = ai_service.improve_text_with_ai_or_rule("I go market")

    assert result == analyze_sentence("I go market")
