from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


from analyzer import analyze_sentence
from speech_service import transcribe_audio_file


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
        "version": "1.0.0",
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
    text = request.text.strip()

    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    try:
        return analyze_sentence(text)
    except Exception as error:
        print("Analyze error:", error)
        raise HTTPException(status_code=500, detail="Analyze failed")


@app.post("/speech/analyze")
async def analyze_speech(
    file: UploadFile = File(...),
    simulatedText: str = Form(""),
):
    try:
        transcribed_text = await transcribe_audio_file(
            file=file,
            simulated_text=simulatedText,
        )

        result = analyze_sentence(transcribed_text)

        result["audioFileName"] = file.filename
        result["transcribedText"] = transcribed_text

        return result
    except Exception as error:
        print("Speech analyze error:", error)
        raise HTTPException(status_code=500, detail="Speech analyze failed")