import sys
from pathlib import Path

import pytest


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from content_schemas import ContentItem  # noqa: E402
from content_store import (  # noqa: E402
    get_published_content_items,
    load_content_items,
    save_content_items,
)


def build_test_item(content_id: str, is_published: bool = True) -> ContentItem:
    return ContentItem(
        id=content_id,
        type="topic",
        title="Test Topic",
        level="beginner",
        category="test",
        languageSupport="both",
        prompt="Practice a test conversation.",
        expectedResponse="I can practice this test topic.",
        sentenceStarters=["I can...", "This topic is..."],
        keyWords=["test", "practice"],
        mediaUrl=None,
        isPublished=is_published,
        isPremium=False,
        createdAt="2026-05-13T00:00:00Z",
        updatedAt="2026-05-13T00:00:00Z",
    )


def test_real_content_json_loads_successfully():
    items = load_content_items()

    assert len(items) >= 8
    assert all(isinstance(item, ContentItem) for item in items)

    content_types = {item.type for item in items}
    assert "story" in content_types
    assert "confidenceVideo" in content_types
    assert "readingListening" in content_types
    assert "topic" in content_types


def test_get_published_content_items_filters_unpublished(tmp_path):
    path = tmp_path / "content_items.json"

    published_item = build_test_item("published-item", True)
    unpublished_item = build_test_item("unpublished-item", False)

    save_content_items([published_item, unpublished_item], path)

    published_items = get_published_content_items(path)

    assert [item.id for item in published_items] == ["published-item"]


def test_load_content_items_rejects_invalid_items_shape(tmp_path):
    path = tmp_path / "content_items.json"
    path.write_text('{"items": "not-a-list"}', encoding="utf-8")

    with pytest.raises(ValueError):
        load_content_items(path)


def test_save_and_load_content_items_roundtrip(tmp_path):
    path = tmp_path / "content_items.json"
    item = build_test_item("roundtrip-item", True)

    save_content_items([item], path)
    loaded_items = load_content_items(path)

    assert len(loaded_items) == 1
    assert loaded_items[0].id == "roundtrip-item"
    assert loaded_items[0].title == "Test Topic"
