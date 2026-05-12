import math
from typing import Any, Dict

from analyzer import analyze_sentence
from provider_registry import resolve_ai_mode
from schemas import AI_CORRECTION_RESPONSE_KEYS, AICorrectionResponse
from settings import (
    AI_ENABLE_PAID_CALLS,
    AI_MAX_INPUT_CHARS,
    AI_MODE,
    AI_TIMEOUT_SECONDS,
    OPENAI_API_KEY,
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
    Placeholder for future paid OpenAI correction.

    No external API calls are made in Phase 6B1. Paid OpenAI correction must
    pass cost guards first, and the current placeholder still safely falls back
    to the rule-based analyzer.
    """

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
    Future OpenAI call boundary.

    Phase 6B1 intentionally does not call OpenAI. Keeping this as a separate
    boundary makes cost-guard tests prove unsafe input never reaches the paid
    provider path.
    """

    return analyze_sentence(text)


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
