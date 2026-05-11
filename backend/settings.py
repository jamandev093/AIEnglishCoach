import os


def _get_int_env(name: str, default: int) -> int:
    value = os.getenv(name, "").strip()

    if not value:
        return default

    try:
        return int(value)
    except ValueError:
        return default


APP_NAME = "AI English Coach Backend"
APP_VERSION = "1.0.0"
AI_MODE = "rule"
STT_MODE = os.getenv("STT_MODE", "fake").strip().lower() or "fake"
STT_PROVIDER = os.getenv("STT_PROVIDER", "fake").strip().lower() or "fake"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_STT_MODEL = os.getenv("OPENAI_STT_MODEL", "gpt-4o-mini-transcribe")
MAX_AUDIO_SECONDS = _get_int_env("MAX_AUDIO_SECONDS", 60)
MAX_AUDIO_MB = _get_int_env("MAX_AUDIO_MB", 10)
