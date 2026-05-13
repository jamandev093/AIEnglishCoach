from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from coach_service import analyze_speech_file, analyze_text as analyze_text_service
from content_service import get_confidence_videos, get_reading_listening, get_stories, get_topics
from schemas import AnalyzeRequest
from settings import APP_NAME, APP_VERSION


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Backend API for AI English Coach MVP",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "success": True,
        "message": "AI English Coach backend is running 🚀",
        "version": APP_VERSION,
    }


@app.get("/health")
def health_check():
    return {
        "success": True,
        "status": "healthy",
        "service": APP_NAME,
    }


@app.get("/content/stories")
def content_stories():
    return get_stories()


@app.get("/content/confidence-videos")
def content_confidence_videos():
    return get_confidence_videos()


@app.get("/content/reading-listening")
def content_reading_listening():
    return get_reading_listening()


@app.get("/content/topics")
def content_topics():
    return get_topics()


@app.post("/analyze")
def analyze_text(request: AnalyzeRequest):
    text = request.text.strip()

    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    try:
        return analyze_text_service(text)
    except Exception as error:
        print("Analyze error:", error)
        raise HTTPException(status_code=500, detail="Analyze failed")


@app.post("/speech/analyze")
async def analyze_speech(
    file: UploadFile = File(...),
    simulatedText: str = Form(""),
):
    try:
        return await analyze_speech_file(
            file=file,
            simulated_text=simulatedText,
        )
    except Exception as error:
        print("Speech analyze error:", error)
        raise HTTPException(status_code=500, detail="Speech analyze failed")
