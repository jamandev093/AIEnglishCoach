from typing import Dict

from analyzer import analyze_sentence
from settings import AI_MODE


def improve_text_with_ai_or_rule(text: str) -> Dict:
    """
    Future AI correction entrypoint.

    Real AI correction is intentionally not implemented yet. Rule-based
    analysis remains the default and safe fallback for every unsupported mode.
    """

    if AI_MODE == "rule":
        return analyze_sentence(text)

    if AI_MODE == "real":
        return improve_text_with_real_ai_placeholder(text)

    return analyze_sentence(text)


def improve_text_with_real_ai_placeholder(text: str) -> Dict:
    """
    Placeholder for future OpenAI/Gemini/local-model correction.

    No external API calls or API keys are used in Phase 3. Until real AI is
    implemented, this safely falls back to the rule-based analyzer.
    """

    return analyze_sentence(text)


def analyze_with_ai_fallback(text: str) -> Dict:
    return improve_text_with_ai_or_rule(text)
