from typing import Dict, Optional

from provider_registry import resolve_tts_mode, resolve_tts_provider
from settings import TTS_MODE, TTS_PROVIDER


def get_tts_status() -> Dict:
    return {
        "mode": resolve_tts_mode(TTS_MODE),
        "provider": resolve_tts_provider(TTS_PROVIDER),
        "backendTtsEnabled": False,
    }


def synthesize_speech(text: str, voice: Optional[str] = None) -> Dict:
    """
    TTS provider foundation.

    Current product strategy uses device/frontend TTS first. Backend audio
    generation remains disabled until a future provider is intentionally added.
    """

    status = get_tts_status()

    return {
        "success": True,
        "text": text.strip(),
        "voice": voice,
        "audioUrl": None,
        "audioContent": None,
        **status,
    }
