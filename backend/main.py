from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from services.coach_service import analyze_sentence
from services.stt_service import fake_transcribe_audio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Backend is running 🚀"}


@app.post("/analyze")
def analyze(data: dict):
    text = data.get("text", "")
    return analyze_sentence(text)


@app.post("/speech/analyze")
async def speech_analyze(file: UploadFile = File(...)):
    # Phase 1: fake STT for testing full audio upload pipeline
    spoken_text = await fake_transcribe_audio(file)

    result = analyze_sentence(spoken_text)

    return {
        "text": spoken_text,
        **result,
    }