from typing import List

from content_schemas import ContentItem, ContentListResponse
from sample_content import SAMPLE_CONTENT


def _published_items(items: List[ContentItem]) -> List[ContentItem]:
    return [item for item in items if item.isPublished]


def get_content_by_type(content_type: str) -> ContentListResponse:
    items = [
        item
        for item in SAMPLE_CONTENT
        if item.type == content_type and item.isPublished
    ]

    return ContentListResponse(
        success=True,
        count=len(items),
        items=items,
    )


def get_stories() -> ContentListResponse:
    return get_content_by_type("story")


def get_confidence_videos() -> ContentListResponse:
    return get_content_by_type("confidenceVideo")


def get_reading_listening() -> ContentListResponse:
    return get_content_by_type("readingListening")


def get_topics() -> ContentListResponse:
    return get_content_by_type("topic")
