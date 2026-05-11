import sys
from pathlib import Path

from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import cache_service  # noqa: E402
import provider_registry  # noqa: E402
import settings  # noqa: E402
import translation_service  # noqa: E402
import tts_service  # noqa: E402
from main import app  # noqa: E402


client = TestClient(app)


def test_provider_defaults_are_free_first_and_disabled_where_needed():
    assert settings.STT_MODE == "fake"
    assert settings.STT_PROVIDER == "fake"
    assert settings.TTS_MODE == "frontend"
    assert settings.TTS_PROVIDER == "device"
    assert settings.TRANSLATION_MODE == "rule"
    assert settings.TRANSLATION_PROVIDER == "rule"
    assert settings.CACHE_MODE == "disabled"
    assert settings.CACHE_PROVIDER == "none"
    assert isinstance(settings.CACHE_TTL_SECONDS, int)


def test_provider_registry_resolves_unsupported_values_to_safe_defaults():
    assert provider_registry.resolve_stt_mode("unsupported") == "fake"
    assert provider_registry.resolve_stt_provider("unsupported") == "fake"
    assert provider_registry.resolve_tts_mode("unsupported") == "frontend"
    assert provider_registry.resolve_tts_provider("unsupported") == "device"
    assert provider_registry.resolve_translation_mode("unsupported") == "rule"
    assert provider_registry.resolve_translation_provider("unsupported") == "rule"
    assert provider_registry.resolve_cache_mode("unsupported") == "disabled"
    assert provider_registry.resolve_cache_provider("unsupported") == "none"


def test_translation_placeholder_is_fallback_only_and_requires_no_api_key(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    result = translation_service.translate_text(
        text="I am learning English.",
        target_language="hi",
        source_language="en",
    )

    assert result["success"] is True
    assert result["sourceText"] == "I am learning English."
    assert result["translatedText"] == "I am learning English."
    assert result["cacheHit"] is False
    assert result["backendTranslationEnabled"] is False


def test_tts_placeholder_uses_frontend_device_strategy_and_generates_no_audio():
    status = tts_service.get_tts_status()
    result = tts_service.synthesize_speech("I am learning English.")

    assert status["mode"] == "frontend"
    assert status["provider"] == "device"
    assert status["backendTtsEnabled"] is False
    assert result["success"] is True
    assert result["audioUrl"] is None
    assert result["audioContent"] is None
    assert result["backendTtsEnabled"] is False


def test_cache_placeholder_is_disabled_and_no_op():
    status = cache_service.get_cache_status()

    assert status["mode"] == "disabled"
    assert status["provider"] == "none"
    assert status["enabled"] is False
    assert cache_service.get_cached_value("corrections", "I go market") is None
    assert (
        cache_service.set_cached_value(
            "corrections",
            "I go market",
            {"correctedText": "I went to the market."},
        )
        is False
    )


def test_speech_endpoint_behavior_remains_unchanged_with_provider_foundation():
    response = client.post(
        "/speech/analyze",
        files={"file": ("sample.wav", b"fake audio", "audio/wav")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["audioFileName"] == "sample.wav"
    assert data["transcribedText"] == "I go market"
    assert data["correctedText"] == "I went to the market."
