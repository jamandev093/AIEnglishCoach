import sys
from pathlib import Path

from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import admin_security  # noqa: E402
import admin_user_service  # noqa: E402
from main import app  # noqa: E402
from user_schemas import AdminUserDetail, UserAccess, UserPerformance, UserProfile  # noqa: E402
from user_store import save_user_records  # noqa: E402


client = TestClient(app)


def build_test_user(
    user_id: str,
    phone_number: str,
    access_source: str,
    access_level: str,
    activity_status: str,
) -> AdminUserDetail:
    return AdminUserDetail(
        profile=UserProfile(
            id=user_id,
            phoneNumber=phone_number,
            email=None,
            displayName=f"Test {user_id}",
            nativeLanguage="hindi",
            englishLevel="beginner",
            createdAt="2026-05-15T00:00:00Z",
            updatedAt="2026-05-15T00:00:00Z",
            lastActiveAt="2026-05-15T00:00:00Z",
            isActive=True,
        ),
        access=UserAccess(
            accessLevel=access_level,
            accessSource=access_source,
            accessStatus="active",
            accessExpiresAt=None,
            courseId=None,
            courseName=None,
            manualReason=None,
            grantedByAdminId=None,
            updatedAt="2026-05-15T00:00:00Z",
        ),
        performance=UserPerformance(
            userId=user_id,
            confidenceScore=55,
            fluencyScore=50,
            pronunciationScore=52,
            grammarScore=51,
            speakingPracticeCount=4,
            topicsPracticed=1,
            storiesCompleted=0,
            readingListeningCompleted=0,
            confidenceMissionsCompleted=0,
            totalPracticeMinutes=30,
            lastPracticeAt="2026-05-15T00:00:00Z",
            repeatedMistakes=[],
            updatedAt="2026-05-15T00:00:00Z",
        ),
        activityStatus=activity_status,
        adminNotes=[],
    )


def setup_admin_user_test_store(monkeypatch, tmp_path):
    test_store_path = tmp_path / "users.json"

    users = [
        build_test_user(
            "user-paid-001",
            "+919111111111",
            "payment",
            "premium",
            "currentlyActive",
        ),
        build_test_user(
            "user-free-001",
            "+919222222222",
            "none",
            "free",
            "nonSerious",
        ),
        build_test_user(
            "user-scholarship-001",
            "+919333333333",
            "scholarship",
            "premium",
            "activeToday",
        ),
    ]

    save_user_records(users, test_store_path)

    monkeypatch.setattr(admin_security, "ADMIN_API_KEY", "test-admin-key")
    monkeypatch.setattr(admin_user_service, "USER_STORE_PATH", test_store_path)

    return test_store_path


def test_admin_users_list_requires_admin_key(monkeypatch, tmp_path):
    setup_admin_user_test_store(monkeypatch, tmp_path)

    response = client.get("/admin/users")

    assert response.status_code == 401
    assert response.json()["detail"] == "Admin key is required."


def test_admin_users_list_returns_user_summaries(monkeypatch, tmp_path):
    setup_admin_user_test_store(monkeypatch, tmp_path)

    response = client.get(
        "/admin/users",
        headers={"X-Admin-Key": "test-admin-key"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert data["count"] == 3

    ids = {user["id"] for user in data["users"]}
    assert "user-paid-001" in ids
    assert "user-free-001" in ids


def test_admin_users_search_by_phone(monkeypatch, tmp_path):
    setup_admin_user_test_store(monkeypatch, tmp_path)

    response = client.get(
        "/admin/users/search?phone=9333",
        headers={"X-Admin-Key": "test-admin-key"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["count"] == 1
    assert data["users"][0]["id"] == "user-scholarship-001"


def test_admin_users_search_requires_phone_query(monkeypatch, tmp_path):
    setup_admin_user_test_store(monkeypatch, tmp_path)

    response = client.get(
        "/admin/users/search?phone=",
        headers={"X-Admin-Key": "test-admin-key"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Phone search query is required."


def test_admin_users_metrics_returns_required_counts(monkeypatch, tmp_path):
    setup_admin_user_test_store(monkeypatch, tmp_path)

    response = client.get(
        "/admin/users/metrics",
        headers={"X-Admin-Key": "test-admin-key"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["totalRegisteredUsers"] == 3
    assert data["totalPaidUsers"] == 1
    assert data["totalUnpaidUsers"] == 2
    assert data["totalScholarshipUsers"] == 1
    assert data["currentlyActiveUsers"] == 1
    assert data["nonSeriousUsers"] == 1


def test_admin_user_detail_returns_full_profile(monkeypatch, tmp_path):
    setup_admin_user_test_store(monkeypatch, tmp_path)

    response = client.get(
        "/admin/users/user-paid-001",
        headers={"X-Admin-Key": "test-admin-key"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["profile"]["id"] == "user-paid-001"
    assert data["access"]["accessSource"] == "payment"
    assert data["performance"]["speakingPracticeCount"] == 4


def test_admin_user_detail_returns_404_for_missing_user(monkeypatch, tmp_path):
    setup_admin_user_test_store(monkeypatch, tmp_path)

    response = client.get(
        "/admin/users/missing-user",
        headers={"X-Admin-Key": "test-admin-key"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found."


def test_admin_user_access_update_grants_manual_premium(monkeypatch, tmp_path):
    setup_admin_user_test_store(monkeypatch, tmp_path)

    response = client.put(
        "/admin/users/user-free-001/access",
        headers={"X-Admin-Key": "test-admin-key"},
        json={
            "accessLevel": "premium",
            "accessSource": "adminManual",
            "accessStatus": "active",
            "accessExpiresAt": None,
            "courseId": "premium-speaking-v1",
            "courseName": "Premium Speaking Course",
            "manualReason": "Owner activated premium manually.",
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["profile"]["id"] == "user-free-001"
    assert data["access"]["accessLevel"] == "premium"
    assert data["access"]["accessSource"] == "adminManual"
    assert data["access"]["accessStatus"] == "active"
    assert data["access"]["manualReason"] == "Owner activated premium manually."


def test_admin_user_access_update_grants_scholarship_free_access(monkeypatch, tmp_path):
    setup_admin_user_test_store(monkeypatch, tmp_path)

    response = client.put(
        "/admin/users/user-free-001/access",
        headers={"X-Admin-Key": "test-admin-key"},
        json={
            "accessLevel": "premium",
            "accessSource": "scholarship",
            "accessStatus": "active",
            "accessExpiresAt": "2026-08-15T00:00:00Z",
            "courseId": "premium-speaking-v1",
            "courseName": "Premium Speaking Course",
            "manualReason": "Poor-student free access.",
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["access"]["accessSource"] == "scholarship"
    assert data["access"]["accessExpiresAt"] == "2026-08-15T00:00:00Z"
    assert data["access"]["manualReason"] == "Poor-student free access."


def test_admin_user_access_update_requires_admin_key(monkeypatch, tmp_path):
    setup_admin_user_test_store(monkeypatch, tmp_path)

    response = client.put(
        "/admin/users/user-free-001/access",
        json={
            "accessLevel": "premium",
            "accessSource": "adminManual",
            "accessStatus": "active",
            "manualReason": "Owner activated premium manually.",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Admin key is required."


def test_admin_user_access_update_returns_404_for_missing_user(monkeypatch, tmp_path):
    setup_admin_user_test_store(monkeypatch, tmp_path)

    response = client.put(
        "/admin/users/missing-user/access",
        headers={"X-Admin-Key": "test-admin-key"},
        json={
            "accessLevel": "premium",
            "accessSource": "adminManual",
            "accessStatus": "active",
            "manualReason": "Owner activated premium manually.",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found."


def test_admin_user_access_revoke_and_expire(monkeypatch, tmp_path):
    setup_admin_user_test_store(monkeypatch, tmp_path)

    revoke_response = client.post(
        "/admin/users/user-paid-001/access/revoke",
        headers={"X-Admin-Key": "test-admin-key"},
    )

    assert revoke_response.status_code == 200
    assert revoke_response.json()["access"]["accessStatus"] == "revoked"

    expire_response = client.post(
        "/admin/users/user-paid-001/access/expire",
        headers={"X-Admin-Key": "test-admin-key"},
    )

    assert expire_response.status_code == 200
    assert expire_response.json()["access"]["accessStatus"] == "expired"


def test_admin_user_access_revoke_returns_404_for_missing_user(monkeypatch, tmp_path):
    setup_admin_user_test_store(monkeypatch, tmp_path)

    response = client.post(
        "/admin/users/missing-user/access/revoke",
        headers={"X-Admin-Key": "test-admin-key"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found."
