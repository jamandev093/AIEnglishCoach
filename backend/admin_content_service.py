from typing import List

from fastapi import HTTPException, status

from content_schemas import ContentItem, ContentListResponse
from content_store import CONTENT_ITEMS_PATH, load_content_items, save_content_items


CONTENT_STORE_PATH = CONTENT_ITEMS_PATH


def list_admin_content_items() -> ContentListResponse:
    """Return all content items for admin, including unpublished items."""

    items = load_content_items(CONTENT_STORE_PATH)

    return ContentListResponse(
        success=True,
        count=len(items),
        items=items,
    )


def create_admin_content_item(item: ContentItem) -> ContentItem:
    """Create one content item in JSON storage.

    Duplicate IDs are rejected so admin content stays stable.
    """

    items: List[ContentItem] = load_content_items(CONTENT_STORE_PATH)

    if any(existing_item.id == item.id for existing_item in items):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Content item with this id already exists.",
        )

    items.append(item)
    save_content_items(items, CONTENT_STORE_PATH)

    return item
