import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import access_guard  # noqa: E402
from access_guard import can_use_premium_ai, require_premium_ai_access  # noqa: E402
from user_schemas import AdminUserDetail, UserAccess, UserPerformance, UserProfile  # noqa: E402
from user_store import save_user_records  # noqa: E402


def build_access_guard_test_user(
    user_id: str,
    phone_number: str,
    access_level: str,
    access_source: str,
    access_status: str,
) -> AdminUserDetail:
    return AdminUserDetail(
        profile=UserProfile(
            id=user_id,
            phoneNumber=phone_number,
            email=None,
            displayName=f"Test {user_id}",
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


def setup_access_guard_test_store(monkeypatch, tmp_path):
    test_store_path = tmp_path / "users.json"

    users = [
        build_access_guard_test_user(
            "user-payment-premium",
            "9111111111",
            "premium",
            "payment",
            "active",
        ),
        build_access_guard_test_user(
            "user-admin-premium",
            "9222222222",
            "premium",
            "adminManual",
            "active",
        ),
        build_access_guard_test_user(
            "user-scholarship-premium",
            "9333333333",
            "premium",
            "scholarship",
            "active",
        ),
        build_access_guard_test_user(
            "user-trial-premium",
            "9444444444",
            "premium",
            "trial",
            "active",
        ),
        build_access_guard_test_user(
            "user-free-active",
            "9555555555",
            "free",
            "none",
            "active",
        ),
        build_access_guard_test_user(
            "user-premium-expired",
            "9666666666",
            "premium",
            "payment",
            "expired",
        ),
        build_access_guard_test_user(
            "user-premium-revoked",
            "9777777777",
            "premium",
            "payment",
            "revoked",
        ),
        build_access_guard_test_user(
            "user-premium-pending",
            "9888888888",
            "premium",
            "payment",
            "pending",
        ),
    ]

    save_user_records(users, test_store_path)

    monkeypatch.setattr(access_guard, "ACCESS_GUARD_USER_STORE_PATH", test_store_path)

    return test_store_path


def test_can_use_premium_ai_allows_active_payment_premium(monkeypatch, tmp_path):
    setup_access_guard_test_store(monkeypatch, tmp_path)

    assert can_use_premium_ai("user-payment-premium") is True


def test_can_use_premium_ai_allows_active_admin_manual_premium(monkeypatch, tmp_path):
    setup_access_guard_test_store(monkeypatch, tmp_path)

    assert can_use_premium_ai("user-admin-premium") is True


def test_can_use_premium_ai_allows_active_scholarship_premium(monkeypatch, tmp_path):
    setup_access_guard_test_store(monkeypatch, tmp_path)

    assert can_use_premium_ai("user-scholarship-premium") is True


def test_can_use_premium_ai_allows_active_trial_premium(monkeypatch, tmp_path):
    setup_access_guard_test_store(monkeypatch, tmp_path)

    assert can_use_premium_ai("user-trial-premium") is True


def test_can_use_premium_ai_rejects_free_user(monkeypatch, tmp_path):
    setup_access_guard_test_store(monkeypatch, tmp_path)

    assert can_use_premium_ai("user-free-active") is False


def test_can_use_premium_ai_rejects_expired_premium(monkeypatch, tmp_path):
    setup_access_guard_test_store(monkeypatch, tmp_path)

    assert can_use_premium_ai("user-premium-expired") is False


def test_can_use_premium_ai_rejects_revoked_premium(monkeypatch, tmp_path):
    setup_access_guard_test_store(monkeypatch, tmp_path)

    assert can_use_premium_ai("user-premium-revoked") is False


def test_can_use_premium_ai_rejects_pending_premium(monkeypatch, tmp_path):
    setup_access_guard_test_store(monkeypatch, tmp_path)

    assert can_use_premium_ai("user-premium-pending") is False


def test_can_use_premium_ai_returns_404_for_missing_user(monkeypatch, tmp_path):
    setup_access_guard_test_store(monkeypatch, tmp_path)

    with pytest.raises(HTTPException) as error:
        can_use_premium_ai("missing-user")

    assert error.value.status_code == 404
    assert error.value.detail == "User not found."


def test_require_premium_ai_access_returns_user_for_active_premium(monkeypatch, tmp_path):
    setup_access_guard_test_store(monkeypatch, tmp_path)

    user = require_premium_ai_access("user-payment-premium")

    assert user.profile.id == "user-payment-premium"


def test_require_premium_ai_access_raises_403_for_free_user(monkeypatch, tmp_path):
    setup_access_guard_test_store(monkeypatch, tmp_path)

    with pytest.raises(HTTPException) as error:
        require_premium_ai_access("user-free-active")

    assert error.value.status_code == 403
    assert error.value.detail == "Premium AI access required."


def test_require_premium_ai_access_requires_user_id(monkeypatch, tmp_path):
    setup_access_guard_test_store(monkeypatch, tmp_path)

    with pytest.raises(HTTPException) as error:
        require_premium_ai_access("   ")

    assert error.value.status_code == 400
    assert error.value.detail == "User id is required."
