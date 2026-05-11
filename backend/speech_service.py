from fastapi import UploadFile


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

    return fake_transcribe_audio(file.filename)


def fake_transcribe_audio(filename: str) -> str:
    """
    MVP fallback transcription.
    Later this will be replaced by real speech-to-text.
    """

    return "I go market"