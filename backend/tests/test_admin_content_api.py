import sys
from pathlib import Path

from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import admin_content_service  # noqa: E402
import admin_security  # noqa: E402
from content_schemas import ContentItem  # noqa: E402
from content_store import save_content_items  # noqa: E402
from main import app  # noqa: E402


client = TestClient(app)


def build_admin_test_item(content_id: str) -> ContentItem:
    return ContentItem(
        id=content_id,
        type="topic",
        title="Admin Test Topic",
        level="beginner",
        category="admin-test",
        languageSupport="both",
        prompt="Practice an admin test topic.",
        expectedResponse="I can practice this admin test topic.",
        sentenceStarters=["I can...", "This topic is..."],
        keyWords=["admin", "test"],
        mediaUrl=None,
        isPublished=True,
        isPremium=False,
        createdAt="2026-05-13T00:00:00Z",
        updatedAt="2026-05-13T00:00:00Z",
    )


def setup_admin_test_store(monkeypatch, tmp_path):
    test_store_path = tmp_path / "content_items.json"

    save_content_items(
        [
            build_admin_test_item("admin-existing-001"),
        ],
        test_store_path,
    )

    monkeypatch.setattr(admin_security, "ADMIN_API_KEY", "test-admin-key")
    monkeypatch.setattr(admin_content_service, "CONTENT_STORE_PATH", test_store_path)

    return test_store_path


def test_admin_content_list_requires_admin_key(monkeypatch, tmp_path):
    setup_admin_test_store(monkeypatch, tmp_path)

    response = client.get("/admin/content")

    assert response.status_code == 401
    assert response.json()["detail"] == "Admin key is required."


def test_admin_content_list_rejects_wrong_admin_key(monkeypatch, tmp_path):
    setup_admin_test_store(monkeypatch, tmp_path)

    response = client.get(
        "/admin/content",
        headers={"X-Admin-Key": "wrong-key"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Invalid admin key."


def test_admin_content_list_returns_all_items_with_admin_key(monkeypatch, tmp_path):
    setup_admin_test_store(monkeypatch, tmp_path)

    response = client.get(
        "/admin/content",
        headers={"X-Admin-Key": "test-admin-key"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert data["count"] == 1
    assert data["items"][0]["id"] == "admin-existing-001"


def test_admin_content_create_adds_item_with_admin_key(monkeypatch, tmp_path):
    setup_admin_test_store(monkeypatch, tmp_path)

    new_item = build_admin_test_item("admin-new-001")

    response = client.post(
        "/admin/content",
        headers={"X-Admin-Key": "test-admin-key"},
        json=new_item.model_dump() if hasattr(new_item, "model_dump") else new_item.dict(),
    )

    assert response.status_code == 200
    assert response.json()["id"] == "admin-new-001"

    list_response = client.get(
        "/admin/content",
        headers={"X-Admin-Key": "test-admin-key"},
    )

    data = list_response.json()
    ids = {item["id"] for item in data["items"]}

    assert "admin-existing-001" in ids
    assert "admin-new-001" in ids


def test_admin_content_create_rejects_duplicate_id(monkeypatch, tmp_path):
    setup_admin_test_store(monkeypatch, tmp_path)

    duplicate_item = build_admin_test_item("admin-existing-001")

    response = client.post(
        "/admin/content",
        headers={"X-Admin-Key": "test-admin-key"},
        json=duplicate_item.model_dump()
        if hasattr(duplicate_item, "model_dump")
        else duplicate_item.dict(),
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Content item with this id already exists."
