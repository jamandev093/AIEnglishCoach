import json
from pathlib import Path
from typing import List

from content_schemas import ContentItem


CONTENT_DATA_DIR = Path(__file__).resolve().parent / "content_data"
CONTENT_ITEMS_PATH = CONTENT_DATA_DIR / "content_items.json"


def _ensure_content_data_dir() -> None:
    CONTENT_DATA_DIR.mkdir(parents=True, exist_ok=True)


def serialize_content_item(item: ContentItem) -> dict:
    """Convert ContentItem to plain JSON-safe dict."""

    if hasattr(item, "model_dump"):
        return item.model_dump()

    return item.dict()


def load_content_items(path: Path = CONTENT_ITEMS_PATH) -> List[ContentItem]:
    """Load all content items from JSON storage."""

    if not path.exists():
        return []

    raw_text = path.read_text(encoding="utf-8")

    if not raw_text.strip():
        return []

    raw_data = json.loads(raw_text)

    if isinstance(raw_data, dict):
        raw_items = raw_data.get("items", [])
    else:
        raw_items = raw_data

    if not isinstance(raw_items, list):
        raise ValueError("Content JSON must contain an items list.")

    return [ContentItem(**item) for item in raw_items]


def save_content_items(
    items: List[ContentItem],
    path: Path = CONTENT_ITEMS_PATH,
) -> None:
    """Save content items to JSON storage using an atomic replace."""

    _ensure_content_data_dir()

    payload = {
        "items": [serialize_content_item(item) for item in items],
    }

    temp_path = path.with_suffix(".tmp")
    temp_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    temp_path.replace(path)


def get_published_content_items(
    path: Path = CONTENT_ITEMS_PATH,
) -> List[ContentItem]:
    """Return only published content for public app APIs."""

    return [item for item in load_content_items(path) if item.isPublished]
