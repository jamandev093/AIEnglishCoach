import sys
from pathlib import Path

from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import me_service  # noqa: E402
from main import app  # noqa: E402
from user_schemas import AdminUserDetail, UserAccess, UserPerformance, UserProfile  # noqa: E402
from user_store import save_user_records  # noqa: E402


client = TestClient(app)


def build_me_test_user(
    user_id: str,
    phone_number: str,
    access_level: str,
    access_source: str,
    access_status: str,
    display_name: str,
):
    return AdminUserDetail(
        profile=UserProfile(
            id=user_id,
            phoneNumber=phone_number,
            email=None,
            displayName=display_name,
            nativeLanguage="hindi",
            englishLevel="beginner",
            createdAt="2026-05-17T00:00:00Z",
            updatedAt="2026-05-17T00:00:00Z",
            lastActiveAt="2026-05-17T00:00:00Z",
            isActive=True,
        ),
        access=UserAccess(
            accessLevel=access_level,
            accessSource=access_source,
            accessStatus=access_status,
            accessExpiresAt="2026-08-15T00:00:00Z"
            if access_level == "premium"
            else None,
            courseId="premium-speaking-v1" if access_level == "premium" else None,
            courseName="Premium Speaking Course"
            if access_level == "premium"
            else None,
            manualReason=None,
            grantedByAdminId=None,
            updatedAt="2026-05-17T00:00:00Z",
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
            lastPracticeAt="2026-05-17T00:00:00Z",
            repeatedMistakes=[],
            updatedAt="2026-05-17T00:00:00Z",
        ),
        activityStatus="currentlyActive",
        adminNotes=[],
    )


def setup_me_access_test_store(monkeypatch, tmp_path):
    test_store_path = tmp_path / "users.json"

    users = [
        build_me_test_user(
            "user-free-001",
            "9222222222",
            "free",
            "none",
            "active",
            "Free Student",
        ),
        build_me_test_user(
            "user-premium-001",
            "9111111111",
            "premium",
            "payment",
            "active",
            "Premium Student",
        ),
        build_me_test_user(
            "user-scholarship-001",
            "9333333333",
            "premium",
            "scholarship",
            "active",
            "Scholarship Student",
        ),
    ]

    save_user_records(users, test_store_path)

    monkeypatch.setattr(me_service, "ME_USER_STORE_PATH", test_store_path)

    return test_store_path


def test_me_access_returns_free_user_access(monkeypatch, tmp_path):
    setup_me_access_test_store(monkeypatch, tmp_path)

    response = client.get("/me/access?phone=9222222222")

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["userId"] == "user-free-001"
    assert data["phoneNumber"] == "9222222222"
    assert data["displayName"] == "Free Student"
    assert data["accessLevel"] == "free"
    assert data["accessSource"] == "none"
    assert data["accessStatus"] == "active"
    assert data["accessExpiresAt"] is None
    assert data["isPremiumActive"] is False


def test_me_access_returns_premium_user_access(monkeypatch, tmp_path):
    setup_me_access_test_store(monkeypatch, tmp_path)

    response = client.get("/me/access?phone=9111111111")

    assert response.status_code == 200

    data = response.json()

    assert data["userId"] == "user-premium-001"
    assert data["accessLevel"] == "premium"
    assert data["accessSource"] == "payment"
    assert data["accessStatus"] == "active"
    assert data["courseId"] == "premium-speaking-v1"
    assert data["courseName"] == "Premium Speaking Course"
    assert data["isPremiumActive"] is True


def test_me_access_returns_scholarship_user_access(monkeypatch, tmp_path):
    setup_me_access_test_store(monkeypatch, tmp_path)

    response = client.get("/me/access?phone=9333333333")

    assert response.status_code == 200

    data = response.json()

    assert data["userId"] == "user-scholarship-001"
    assert data["accessLevel"] == "premium"
    assert data["accessSource"] == "scholarship"
    assert data["accessStatus"] == "active"
    assert data["isPremiumActive"] is True


def test_me_access_requires_phone_query():
    response = client.get("/me/access")

    assert response.status_code == 422


def test_me_access_rejects_empty_phone(monkeypatch, tmp_path):
    setup_me_access_test_store(monkeypatch, tmp_path)

    response = client.get("/me/access?phone=%20%20%20")

    assert response.status_code == 400
    assert response.json()["detail"] == "Phone number is required."


def test_me_access_returns_404_for_missing_user(monkeypatch, tmp_path):
    setup_me_access_test_store(monkeypatch, tmp_path)

    response = client.get("/me/access?phone=9000000000")

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found."
