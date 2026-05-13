from typing import List

from content_schemas import ContentItem, ContentListResponse
from content_store import get_published_content_items
from sample_content import SAMPLE_CONTENT


def _load_public_items() -> List[ContentItem]:
    """Load public content from JSON store, with sample content fallback.

    The fallback keeps the mobile app safe if the JSON file is missing or invalid.
    """

    try:
        items = get_published_content_items()

        if items:
            return items
    except Exception as error:
        print("Content JSON fallback:", error)

    return [item for item in SAMPLE_CONTENT if item.isPublished]


def get_content_by_type(content_type: str) -> ContentListResponse:
    items = [
        item
        for item in _load_public_items()
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
