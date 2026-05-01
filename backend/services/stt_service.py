from fastapi import UploadFile


async def fake_transcribe_audio(file: UploadFile) -> str:
    """
    Phase 1 fake STT.
    Later we replace this with Whisper or open-source STT.
    """

    # Read file once to confirm backend receives audio
    await file.read()

    return "I go market"