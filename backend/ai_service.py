from typing import Dict

from analyzer import analyze_sentence


def analyze_with_ai_fallback(text: str) -> Dict:
    """
    Future AI correction entrypoint.

    Phase 1 keeps paid/external AI disabled and falls back to the existing
    rule-based analyzer so endpoint behavior remains unchanged.
    """

    return analyze_sentence(text)
