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


def update_admin_content_item(content_id: str, updated_item: ContentItem) -> ContentItem:
    """Update one existing content item by id."""

    if updated_item.id != content_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content id in path and body must match.",
        )

    items: List[ContentItem] = load_content_items(CONTENT_STORE_PATH)

    for index, existing_item in enumerate(items):
        if existing_item.id == content_id:
            items[index] = updated_item
            save_content_items(items, CONTENT_STORE_PATH)
            return updated_item

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Content item not found.",
    )


def set_admin_content_publish_status(
    content_id: str,
    is_published: bool,
) -> ContentItem:
    """Publish or unpublish one content item without deleting it."""

    items: List[ContentItem] = load_content_items(CONTENT_STORE_PATH)

    for index, item in enumerate(items):
        if item.id == content_id:
            item_data = item.model_dump() if hasattr(item, "model_dump") else item.dict()
            item_data["isPublished"] = is_published
            updated_item = ContentItem(**item_data)

            items[index] = updated_item
            save_content_items(items, CONTENT_STORE_PATH)
            return updated_item

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Content item not found.",
    )
