import sys
from pathlib import Path

from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from main import app  # noqa: E402


client = TestClient(app)


CONTENT_ENDPOINTS = [
    ("/content/stories", "story"),
    ("/content/confidence-videos", "confidenceVideo"),
    ("/content/reading-listening", "readingListening"),
    ("/content/topics", "topic"),
]


REQUIRED_ITEM_KEYS = {
    "id",
    "type",
    "title",
    "level",
    "category",
    "languageSupport",
    "prompt",
    "expectedResponse",
    "sentenceStarters",
    "keyWords",
    "mediaUrl",
    "isPublished",
    "isPremium",
    "createdAt",
    "updatedAt",
}


def test_content_endpoints_return_published_items_only():
    for endpoint, expected_type in CONTENT_ENDPOINTS:
        response = client.get(endpoint)

        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert isinstance(data["count"], int)
        assert isinstance(data["items"], list)
        assert data["count"] == len(data["items"])
        assert data["count"] >= 1

        for item in data["items"]:
            assert set(item.keys()) == REQUIRED_ITEM_KEYS
            assert item["type"] == expected_type
            assert item["isPublished"] is True


def test_no_daily_missions_endpoint_exists():
    response = client.get("/content/daily-missions")

    assert response.status_code == 404


def test_topics_do_not_return_unpublished_sample_item():
    response = client.get("/content/topics")

    assert response.status_code == 200

    data = response.json()
    ids = {item["id"] for item in data["items"]}

    assert "topic-hidden-001" not in ids


def test_public_content_endpoints_use_json_store_items():
    response = client.get("/content/topics")

    assert response.status_code == 200

    data = response.json()
    ids = {item["id"] for item in data["items"]}

    assert "topic-001" in ids
    assert "topic-002" in ids
    assert "topic-hidden-001" not in ids
