from typing import List, Optional

from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    text: str


class AnalyzeResponse(BaseModel):
    success: bool
    originalText: str
    correctedText: str
    improved: str
    score: int
    mistakes: List[str]
    simpleExplanation: str
    teacherExplanation: str
    smartSuggestion: str
    repeatSentence: str
    confidenceScore: int
    fluencyScore: int
    pronunciationScore: int
    coachReply: str
    audioFileName: Optional[str] = None
    transcribedText: Optional[str] = None
