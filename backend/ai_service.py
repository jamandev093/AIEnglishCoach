from typing import Dict

from analyzer import analyze_sentence
from provider_registry import resolve_ai_mode
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


def analyze_with_ai_fallback(text: str) -> Dict:
    return improve_text_with_ai_or_rule(text)
