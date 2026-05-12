from typing import Dict

from analyzer import analyze_sentence
from provider_registry import resolve_ai_mode
from settings import AI_MODE


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

    No external API calls or API keys are used in Phase 6A. Until OpenAI
    correction is explicitly implemented, this safely falls back to the
    rule-based analyzer.
    """

    return analyze_sentence(text)


def analyze_with_ai_fallback(text: str) -> Dict:
    return improve_text_with_ai_or_rule(text)
