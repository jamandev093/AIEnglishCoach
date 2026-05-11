from fastapi import UploadFile

from settings import STT_MODE, STT_PROVIDER


SUPPORTED_REAL_STT_PROVIDERS = {"openai", "local", "azure", "google"}


async def transcribe_audio_file(
    file: UploadFile,
    simulated_text: str = "",
) -> str:
    """
    Speech-to-text service foundation.

    Current MVP behavior:
    - Uses simulated_text from frontend if available.
    - Does not run real STT yet.
    - Keeps backend response stable.

    Future behavior:
    - Save uploaded audio temporarily.
    - Send audio to Whisper / open-source STT.
    - Return real transcribed text.
    """

    clean_simulated_text = simulated_text.strip()

    if clean_simulated_text:
        return clean_simulated_text

    stt_mode = (STT_MODE or "fake").strip().lower()
    stt_provider = (STT_PROVIDER or "fake").strip().lower()

    if stt_mode == "fake":
        return fake_transcribe_audio(file.filename)

    if stt_mode == "real" and stt_provider in SUPPORTED_REAL_STT_PROVIDERS:
        return await transcribe_with_real_stt_placeholder(file)

    return fake_transcribe_audio(file.filename)


async def transcribe_with_real_stt_placeholder(file: UploadFile) -> str:
    """
    Placeholder for future real STT integration.

    Real Whisper/OpenAI/open-source STT is intentionally not implemented in
    Phase 2. Until it exists, this safely falls back to the fake transcription.
    """

    return fake_transcribe_audio(file.filename)


def fake_transcribe_audio(filename: str) -> str:
    """
    MVP fallback transcription.
    Later this will be replaced by real speech-to-text.
    """

    return "I go market"
