from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


AI_CORRECTION_RESPONSE_KEYS = {
    "success",
    "originalText",
    "correctedText",
    "improved",
    "score",
    "mistakes",
    "simpleExplanation",
    "teacherExplanation",
    "smartSuggestion",
    "repeatSentence",
    "confidenceScore",
    "fluencyScore",
    "pronunciationScore",
    "coachReply",
}


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


class AICorrectionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    success: bool
    originalText: str
    correctedText: str
    improved: str
    score: int = Field(ge=0, le=100)
    mistakes: List[str]
    simpleExplanation: str
    teacherExplanation: str
    smartSuggestion: str
    repeatSentence: str
    confidenceScore: int = Field(ge=0, le=100)
    fluencyScore: int = Field(ge=0, le=100)
    pronunciationScore: int = Field(ge=0, le=100)
    coachReply: str

    @field_validator("success")
    @classmethod
    def success_must_be_true(cls, value: bool) -> bool:
        if value is not True:
            raise ValueError("AI correction response must be successful")

        return value

    @field_validator(
        "originalText",
        "correctedText",
        "improved",
        "simpleExplanation",
        "teacherExplanation",
        "smartSuggestion",
        "repeatSentence",
        "coachReply",
    )
    @classmethod
    def text_fields_must_not_be_empty(cls, value: str) -> str:
        clean_value = value.strip()

        if not clean_value:
            raise ValueError("AI correction text fields must not be empty")

        return clean_value

    @field_validator("mistakes")
    @classmethod
    def mistakes_must_be_strings(cls, value: List[str]) -> List[str]:
        clean_mistakes = []

        for mistake in value:
            if not isinstance(mistake, str):
                raise ValueError("AI correction mistakes must be strings")

            clean_mistake = mistake.strip()
            if clean_mistake:
                clean_mistakes.append(clean_mistake)

        return clean_mistakes
