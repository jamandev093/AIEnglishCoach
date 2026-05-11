from typing import Dict

from fastapi import UploadFile

from ai_service import analyze_with_ai_fallback
from speech_service import transcribe_audio_file


def analyze_text(text: str) -> Dict:
    return analyze_with_ai_fallback(text)


async def analyze_speech_file(
    file: UploadFile,
    simulated_text: str = "",
) -> Dict:
    transcribed_text = await transcribe_audio_file(
        file=file,
        simulated_text=simulated_text,
    )

    result = analyze_with_ai_fallback(transcribed_text)
    result["audioFileName"] = file.filename
    result["transcribedText"] = transcribed_text

    return result
