from typing import List, Literal, Optional

from pydantic import BaseModel, Field


ContentType = Literal[
    "story",
    "confidenceVideo",
    "readingListening",
    "topic",
]

Level = Literal[
    "beginner",
    "intermediate",
    "advanced",
]

LanguageSupport = Literal[
    "englishOnly",
    "nativeSupport",
    "both",
]


class ContentItem(BaseModel):
    id: str
    type: ContentType
    title: str
    level: Level
    category: str
    languageSupport: LanguageSupport = "both"
    prompt: str
    expectedResponse: Optional[str] = None
    sentenceStarters: List[str] = Field(default_factory=list)
    keyWords: List[str] = Field(default_factory=list)
    mediaUrl: Optional[str] = None
    isPublished: bool = True
    isPremium: bool = False
    createdAt: str
    updatedAt: str


class ContentListResponse(BaseModel):
    success: bool = True
    count: int
    items: List[ContentItem]
