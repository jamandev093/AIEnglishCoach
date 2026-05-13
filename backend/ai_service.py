import json
import logging
import math
from typing import Any, Dict

import httpx

from analyzer import analyze_sentence
from prompt_templates import build_ai_correction_messages
from provider_registry import resolve_ai_mode
from schemas import AI_CORRECTION_RESPONSE_KEYS, AICorrectionResponse
logger = logging.getLogger(__name__)

from settings import (
    AI_ENABLE_PAID_CALLS,
    AI_MAX_INPUT_CHARS,
    AI_MODE,
    AI_TIMEOUT_SECONDS,
    OPENAI_API_KEY,
    OPENAI_BASE_URL,
    OPENAI_MAX_OUTPUT_TOKENS,
    OPENAI_TEXT_MODEL,
)


def improve_text_with_ai_or_rule(text: str) -> Dict:
    """
    Future AI correction entrypoint.

    Real AI correction is intentionally not implemented yet. Rule-based
    analysis remains the default and safe fallback for every unsupported mode.
    """

    ai_mode = resolve_ai_mode(AI_MODE)

    if ai_mode == "rule":
        return analyze_sentence(text)

    if ai_mode == "open_source":
        return improve_text_with_open_source_placeholder(text)

    if ai_mode == "openai":
        return improve_text_with_openai_placeholder(text)

    return analyze_sentence(text)


def improve_text_with_open_source_placeholder(text: str) -> Dict:
    """
    Placeholder for future open-source/local-model correction.

    No local model is loaded in Phase 6A. Until open-source correction is
    implemented, this safely falls back to the rule-based analyzer.
    """

    return analyze_sentence(text)


def improve_text_with_openai_placeholder(text: str) -> Dict:
    """
    Guarded skeleton for future paid OpenAI correction.

    No external API calls are made in Phase 6B4A. Paid OpenAI correction must
    pass cost guards first, and the current sender placeholder still safely
    falls back to the rule-based analyzer.
    """

    if resolve_ai_mode(AI_MODE) != "openai":
        return analyze_sentence(text)

    if not should_attempt_paid_openai_correction(text):
        return analyze_sentence(text)

    return call_openai_correction_placeholder(text)


def should_attempt_paid_openai_correction(text: str) -> bool:
    normalized_text = text.strip()

    if not AI_ENABLE_PAID_CALLS:
        return False

    if not OPENAI_API_KEY.strip():
        return False

    if not OPENAI_TEXT_MODEL.strip():
        return False

    if AI_TIMEOUT_SECONDS <= 0:
        return False

    if AI_MAX_INPUT_CHARS <= 0:
        return False

    if not normalized_text:
        return False

    if len(normalized_text) > AI_MAX_INPUT_CHARS:
        return False

    return True


def call_openai_correction_placeholder(text: str) -> Dict:
    """
    Guarded OpenAI call boundary.

    The caller must pass cost guards before reaching this function. Any OpenAI
    error, timeout, malformed response, or schema validation issue falls back
    to the rule-based analyzer.
    """

    try:
        request_payload = build_openai_correction_request_payload(text)
        raw_response = send_openai_correction_request(request_payload)
    except Exception:
        return analyze_sentence(text)

    return normalize_ai_correction_response_or_fallback(raw_response, text)


def build_openai_correction_request_payload(text: str) -> Dict:
    """
    Build the future OpenAI request payload without sending it.

    The payload shape is intentionally small and testable. A later phase can
    map this directly to an HTTPX request or SDK call.
    """

    return {
        "model": OPENAI_TEXT_MODEL,
        "input": build_ai_correction_messages(text),
        "timeout": AI_TIMEOUT_SECONDS,
        "max_output_tokens": OPENAI_MAX_OUTPUT_TOKENS,
        "text": {
            "format": {
                "type": "json_object",
            },
        },
    }


def send_openai_correction_request(request_payload: Dict) -> Any:
    """
    Send a guarded OpenAI Responses API request and return parsed AI JSON.

    Tests must monkeypatch this function or post_openai_responses_request so no
    paid API request is made during automated test runs.
    """

    response_data = post_openai_responses_request(request_payload)
    output_text = extract_openai_output_text(response_data)

    return parse_openai_json_output(output_text)


def post_openai_responses_request(request_payload: Dict) -> Dict:
    api_payload = {
        key: value for key, value in request_payload.items() if key != "timeout"
    }
    timeout_seconds = request_payload.get("timeout", AI_TIMEOUT_SECONDS)
    url = f"{OPENAI_BASE_URL}/responses"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        logger.info("AI provider selected = openai")
        with httpx.Client(timeout=timeout_seconds) as client:
            response = client.post(url, headers=headers, json=api_payload)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as exc:
        status_code = exc.response.status_code if exc.response is not None else "unknown"
        logger.warning("OpenAI HTTP error status=%s", status_code)
        raise ValueError("OpenAI request failed") from exc
    except httpx.RequestError as exc:
        logger.warning("OpenAI request error type=%s", exc.__class__.__name__)
        raise ValueError("OpenAI request failed") from exc


def extract_openai_output_text(response_data: Any) -> str:
    if not isinstance(response_data, dict):
        raise ValueError("OpenAI response must be a JSON object")

    output_text = response_data.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text

    output_items = response_data.get("output")
    if not isinstance(output_items, list):
        raise ValueError("OpenAI response is missing output text")

    for output_item in output_items:
        if not isinstance(output_item, dict):
            continue

        for content_item in output_item.get("content", []):
            if not isinstance(content_item, dict):
                continue

            if content_item.get("type") == "refusal":
                raise ValueError("OpenAI refused the correction request")

            if content_item.get("type") in {"output_text", "text"}:
                text = content_item.get("text")
                if isinstance(text, str) and text.strip():
                    return text

    raise ValueError("OpenAI response is missing output text")


def parse_openai_json_output(output_text: str) -> Dict:
    parsed_output = json.loads(output_text)

    if not isinstance(parsed_output, dict):
        raise ValueError("OpenAI output must be a JSON object")

    return parsed_output


def normalize_ai_correction_response_or_fallback(
    raw_response: Any,
    original_text: str,
) -> Dict:
    """
    Validate future AI provider JSON against the frontend contract.

    Invalid provider output never reaches the API response. The rule-based
    analyzer remains the fallback for missing fields, bad types, malformed
    score values, or unsafe empty text.
    """

    try:
        return normalize_ai_correction_response(raw_response, original_text)
    except (TypeError, ValueError):
        return analyze_sentence(original_text)


def normalize_ai_correction_response(
    raw_response: Any,
    original_text: str,
) -> Dict:
    if not isinstance(raw_response, dict):
        raise ValueError("AI correction response must be a JSON object")

    missing_keys = AI_CORRECTION_RESPONSE_KEYS - raw_response.keys()
    if missing_keys:
        raise ValueError("AI correction response is missing required keys")

    normalized_original_text = _normalize_text(original_text)
    if not normalized_original_text:
        raise ValueError("Original text must not be empty")

    if raw_response.get("success") is not True:
        raise ValueError("AI correction response must be successful")

    corrected_text = _required_text(raw_response, "correctedText")

    payload = {
        "success": True,
        "originalText": normalized_original_text,
        "correctedText": corrected_text,
        "improved": _text_or_default(raw_response, "improved", corrected_text),
        "score": _normalize_score(raw_response, "score"),
        "mistakes": _normalize_mistakes(raw_response),
        "simpleExplanation": _required_text(raw_response, "simpleExplanation"),
        "teacherExplanation": _required_text(raw_response, "teacherExplanation"),
        "smartSuggestion": _required_text(raw_response, "smartSuggestion"),
        "repeatSentence": _text_or_default(
            raw_response,
            "repeatSentence",
            corrected_text,
        ),
        "confidenceScore": _normalize_score(raw_response, "confidenceScore"),
        "fluencyScore": _normalize_score(raw_response, "fluencyScore"),
        "pronunciationScore": _normalize_score(raw_response, "pronunciationScore"),
        "coachReply": _required_text(raw_response, "coachReply"),
    }

    return AICorrectionResponse(**payload).model_dump()


def _normalize_text(value: str) -> str:
    if not isinstance(value, str):
        raise ValueError("Text value must be a string")

    return " ".join(value.strip().split())


def _required_text(raw_response: Dict, key: str) -> str:
    value = raw_response.get(key)

    if not isinstance(value, str):
        raise ValueError(f"{key} must be a string")

    clean_value = _normalize_text(value)
    if not clean_value:
        raise ValueError(f"{key} must not be empty")

    return clean_value


def _text_or_default(raw_response: Dict, key: str, default: str) -> str:
    value = raw_response.get(key)

    if not isinstance(value, str):
        raise ValueError(f"{key} must be a string")

    clean_value = _normalize_text(value)
    return clean_value or default


def _normalize_score(raw_response: Dict, key: str) -> int:
    value = raw_response.get(key)

    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{key} must be a number")

    if not math.isfinite(value):
        raise ValueError(f"{key} must be finite")

    return max(0, min(round(value), 100))


def _normalize_mistakes(raw_response: Dict) -> list[str]:
    mistakes = raw_response.get("mistakes")

    if not isinstance(mistakes, list):
        raise ValueError("mistakes must be an array")

    clean_mistakes = []

    for mistake in mistakes:
        if not isinstance(mistake, str):
            raise ValueError("mistakes must contain only strings")

        clean_mistake = _normalize_text(mistake)
        if clean_mistake:
            clean_mistakes.append(clean_mistake)

    return clean_mistakes


def analyze_with_ai_fallback(text: str) -> Dict:
    return improve_text_with_ai_or_rule(text)
