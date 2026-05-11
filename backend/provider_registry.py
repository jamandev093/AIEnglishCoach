DEFAULT_STT_MODE = "fake"
DEFAULT_STT_PROVIDER = "fake"
DEFAULT_TTS_MODE = "frontend"
DEFAULT_TTS_PROVIDER = "device"
DEFAULT_TRANSLATION_MODE = "rule"
DEFAULT_TRANSLATION_PROVIDER = "rule"
DEFAULT_CACHE_MODE = "disabled"
DEFAULT_CACHE_PROVIDER = "none"

SUPPORTED_STT_MODES = {DEFAULT_STT_MODE, "real"}
SUPPORTED_STT_PROVIDERS = {DEFAULT_STT_PROVIDER, "local", "openai", "azure", "google"}
SUPPORTED_REAL_STT_PROVIDERS = {"local", "openai", "azure", "google"}

SUPPORTED_TTS_MODES = {DEFAULT_TTS_MODE, "backend", "disabled"}
SUPPORTED_TTS_PROVIDERS = {DEFAULT_TTS_PROVIDER, "local", "openai"}

SUPPORTED_TRANSLATION_MODES = {DEFAULT_TRANSLATION_MODE, "ai", "disabled"}
SUPPORTED_TRANSLATION_PROVIDERS = {DEFAULT_TRANSLATION_PROVIDER, "local", "openai"}

SUPPORTED_CACHE_MODES = {DEFAULT_CACHE_MODE, "memory", "database"}
SUPPORTED_CACHE_PROVIDERS = {DEFAULT_CACHE_PROVIDER, "memory", "postgres", "redis"}


def _normalize_provider_value(value: str, default: str) -> str:
    if value is None:
        return default

    normalized = str(value).strip().lower()
    return normalized or default


def _resolve_provider_value(value: str, supported_values: set[str], default: str) -> str:
    normalized = _normalize_provider_value(value, default)

    if normalized in supported_values:
        return normalized

    return default


def resolve_stt_mode(value: str) -> str:
    return _resolve_provider_value(value, SUPPORTED_STT_MODES, DEFAULT_STT_MODE)


def resolve_stt_provider(value: str) -> str:
    return _resolve_provider_value(value, SUPPORTED_STT_PROVIDERS, DEFAULT_STT_PROVIDER)


def is_supported_real_stt_provider(value: str) -> bool:
    return _normalize_provider_value(value, DEFAULT_STT_PROVIDER) in SUPPORTED_REAL_STT_PROVIDERS


def resolve_tts_mode(value: str) -> str:
    return _resolve_provider_value(value, SUPPORTED_TTS_MODES, DEFAULT_TTS_MODE)


def resolve_tts_provider(value: str) -> str:
    return _resolve_provider_value(value, SUPPORTED_TTS_PROVIDERS, DEFAULT_TTS_PROVIDER)


def resolve_translation_mode(value: str) -> str:
    return _resolve_provider_value(
        value,
        SUPPORTED_TRANSLATION_MODES,
        DEFAULT_TRANSLATION_MODE,
    )


def resolve_translation_provider(value: str) -> str:
    return _resolve_provider_value(
        value,
        SUPPORTED_TRANSLATION_PROVIDERS,
        DEFAULT_TRANSLATION_PROVIDER,
    )


def resolve_cache_mode(value: str) -> str:
    return _resolve_provider_value(value, SUPPORTED_CACHE_MODES, DEFAULT_CACHE_MODE)


def resolve_cache_provider(value: str) -> str:
    return _resolve_provider_value(
        value,
        SUPPORTED_CACHE_PROVIDERS,
        DEFAULT_CACHE_PROVIDER,
    )
