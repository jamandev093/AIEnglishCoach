from typing import Dict, Optional

from provider_registry import resolve_translation_mode, resolve_translation_provider
from settings import TRANSLATION_MODE, TRANSLATION_PROVIDER


def translate_text(
    text: str,
    target_language: str = "en",
    source_language: Optional[str] = None,
) -> Dict:
    """
    Translation provider foundation.

    No external translation provider is enabled in this phase. The service
    returns the original text so future translation can be added without
    changing current endpoint behavior.
    """

    source_text = text.strip()

    return {
        "success": True,
        "mode": resolve_translation_mode(TRANSLATION_MODE),
        "provider": resolve_translation_provider(TRANSLATION_PROVIDER),
        "sourceLanguage": source_language,
        "targetLanguage": target_language,
        "sourceText": source_text,
        "translatedText": source_text,
        "cacheHit": False,
        "backendTranslationEnabled": False,
    }
