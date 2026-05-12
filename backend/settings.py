import os

from provider_registry import (
    DEFAULT_AI_MODE,
    DEFAULT_CACHE_MODE,
    DEFAULT_CACHE_PROVIDER,
    DEFAULT_STT_MODE,
    DEFAULT_STT_PROVIDER,
    DEFAULT_TRANSLATION_MODE,
    DEFAULT_TRANSLATION_PROVIDER,
    DEFAULT_TTS_MODE,
    DEFAULT_TTS_PROVIDER,
)


def _get_int_env(name: str, default: int) -> int:
    value = os.getenv(name, "").strip()

    if not value:
        return default

    try:
        return int(value)
    except ValueError:
        return default


def _get_bool_env(name: str, default: bool) -> bool:
    value = os.getenv(name, "").strip().lower()

    if not value:
        return default

    return value in {"1", "true", "yes", "on"}


APP_NAME = "AI English Coach Backend"
APP_VERSION = "1.0.0"
AI_MODE = os.getenv("AI_MODE", DEFAULT_AI_MODE).strip().lower() or DEFAULT_AI_MODE
STT_MODE = os.getenv("STT_MODE", DEFAULT_STT_MODE).strip().lower() or DEFAULT_STT_MODE
STT_PROVIDER = (
    os.getenv("STT_PROVIDER", DEFAULT_STT_PROVIDER).strip().lower()
    or DEFAULT_STT_PROVIDER
)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_TEXT_MODEL = (
    os.getenv("OPENAI_TEXT_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"
)
AI_MAX_INPUT_CHARS = _get_int_env("AI_MAX_INPUT_CHARS", 1000)
AI_TIMEOUT_SECONDS = _get_int_env("AI_TIMEOUT_SECONDS", 8)
AI_ENABLE_PAID_CALLS = _get_bool_env("AI_ENABLE_PAID_CALLS", False)
OPENAI_STT_MODEL = os.getenv("OPENAI_STT_MODEL", "gpt-4o-mini-transcribe")
MAX_AUDIO_SECONDS = _get_int_env("MAX_AUDIO_SECONDS", 60)
MAX_AUDIO_MB = _get_int_env("MAX_AUDIO_MB", 10)
TTS_MODE = os.getenv("TTS_MODE", DEFAULT_TTS_MODE).strip().lower() or DEFAULT_TTS_MODE
TTS_PROVIDER = (
    os.getenv("TTS_PROVIDER", DEFAULT_TTS_PROVIDER).strip().lower()
    or DEFAULT_TTS_PROVIDER
)
TRANSLATION_MODE = (
    os.getenv("TRANSLATION_MODE", DEFAULT_TRANSLATION_MODE).strip().lower()
    or DEFAULT_TRANSLATION_MODE
)
TRANSLATION_PROVIDER = (
    os.getenv("TRANSLATION_PROVIDER", DEFAULT_TRANSLATION_PROVIDER).strip().lower()
    or DEFAULT_TRANSLATION_PROVIDER
)
CACHE_MODE = (
    os.getenv("CACHE_MODE", DEFAULT_CACHE_MODE).strip().lower()
    or DEFAULT_CACHE_MODE
)
CACHE_PROVIDER = (
    os.getenv("CACHE_PROVIDER", DEFAULT_CACHE_PROVIDER).strip().lower()
    or DEFAULT_CACHE_PROVIDER
)
CACHE_TTL_SECONDS = _get_int_env("CACHE_TTL_SECONDS", 86400)
