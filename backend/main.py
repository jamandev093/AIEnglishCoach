from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from analyzer import analyze_sentence, fake_transcribe_audio


app = FastAPI(
    title="AI English Coach Backend",
    version="1.0.0",
    description="Backend API for AI English Coach MVP",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    text: str


@app.get("/")
def root():
    return {
        "success": True,
        "message": "AI English Coach backend is running 🚀",
    }


@app.get("/health")
def health_check():
    return {
        "success": True,
        "status": "healthy",
        "service": "AI English Coach Backend",
    }


@app.post("/analyze")
def analyze_text(request: AnalyzeRequest):
    result = analyze_sentence(request.text)
    return result


@app.post("/speech/analyze")
async def analyze_speech(file: UploadFile = File(...)):
    transcribed_text = fake_transcribe_audio(file.filename)
    result = analyze_sentence(transcribed_text)

    result["audioFileName"] = file.filename
    result["transcribedText"] = transcribed_text

    return result