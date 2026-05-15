import sys
from pathlib import Path

import pytest


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from user_schemas import AdminUserDetail, UserAccess, UserPerformance, UserProfile  # noqa: E402
from user_store import (  # noqa: E402
    calculate_user_dashboard_metrics,
    create_user_record,
    find_user_by_phone_number,
    list_admin_user_summaries,
    load_user_records,
    save_user_records,
    search_users_by_phone_number,
)


def build_test_user(
    user_id: str = "test-user-001",
    phone_number: str = "+910000000001",
    access_source: str = "none",
    access_level: str = "free",
    activity_status: str = "nonSerious",
) -> AdminUserDetail:
    return AdminUserDetail(
        profile=UserProfile(
            id=user_id,
            phoneNumber=phone_number,
            email=None,
            displayName="Test User",
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
            confidenceScore=50,
            fluencyScore=48,
            pronunciationScore=52,
            grammarScore=49,
            speakingPracticeCount=2,
            topicsPracticed=1,
            storiesCompleted=0,
            readingListeningCompleted=0,
            confidenceMissionsCompleted=0,
            totalPracticeMinutes=20,
            lastPracticeAt="2026-05-15T00:00:00Z",
            repeatedMistakes=[],
            updatedAt="2026-05-15T00:00:00Z",
        ),
        activityStatus=activity_status,
        adminNotes=[],
    )


def test_real_user_json_loads_sample_records():
    users = load_user_records()

    assert len(users) >= 3
    assert all(isinstance(user, AdminUserDetail) for user in users)

    phone_numbers = {user.profile.phoneNumber for user in users}
    assert "+919876543210" in phone_numbers


def test_save_and_load_user_records_roundtrip(tmp_path):
    path = tmp_path / "users.json"
    user = build_test_user()

    save_user_records([user], path)
    loaded_users = load_user_records(path)

    assert len(loaded_users) == 1
    assert loaded_users[0].profile.id == "test-user-001"
    assert loaded_users[0].profile.phoneNumber == "+910000000001"


def test_load_user_records_rejects_invalid_users_shape(tmp_path):
    path = tmp_path / "users.json"
    path.write_text('{"users": "not-a-list"}', encoding="utf-8")

    with pytest.raises(ValueError):
        load_user_records(path)


def test_find_user_by_phone_number(tmp_path):
    path = tmp_path / "users.json"
    user = build_test_user(phone_number="+919999999999")

    save_user_records([user], path)

    found_user = find_user_by_phone_number("+919999999999", path)

    assert found_user is not None
    assert found_user.profile.id == "test-user-001"


def test_search_users_by_partial_phone_number(tmp_path):
    path = tmp_path / "users.json"
    user_one = build_test_user(user_id="user-one", phone_number="+919111111111")
    user_two = build_test_user(user_id="user-two", phone_number="+919222222222")

    save_user_records([user_one, user_two], path)

    response = search_users_by_phone_number("9222", path)

    assert response.success is True
    assert response.count == 1
    assert response.users[0].id == "user-two"


def test_list_admin_user_summaries(tmp_path):
    path = tmp_path / "users.json"
    paid_user = build_test_user(
        user_id="paid-user",
        phone_number="+911111111111",
        access_source="payment",
        access_level="premium",
        activity_status="currentlyActive",
    )
    free_user = build_test_user(
        user_id="free-user",
        phone_number="+912222222222",
        access_source="none",
        access_level="free",
        activity_status="nonSerious",
    )

    save_user_records([paid_user, free_user], path)

    response = list_admin_user_summaries(path)

    assert response.count == 2
    assert response.users[0].phoneNumber == "+911111111111"
    assert response.users[0].accessSource == "payment"


def test_calculate_user_dashboard_metrics_counts_required_lists(tmp_path):
    path = tmp_path / "users.json"

    paid_user = build_test_user(
        user_id="paid-user",
        phone_number="+911111111111",
        access_source="payment",
        access_level="premium",
        activity_status="currentlyActive",
    )
    free_user = build_test_user(
        user_id="free-user",
        phone_number="+912222222222",
        access_source="none",
        access_level="free",
        activity_status="nonSerious",
    )
    scholarship_user = build_test_user(
        user_id="scholarship-user",
        phone_number="+913333333333",
        access_source="scholarship",
        access_level="premium",
        activity_status="activeToday",
    )
    manual_user = build_test_user(
        user_id="manual-user",
        phone_number="+914444444444",
        access_source="adminManual",
        access_level="premium",
        activity_status="inactive",
    )

    save_user_records([paid_user, free_user, scholarship_user, manual_user], path)

    metrics = calculate_user_dashboard_metrics(path)

    assert metrics.totalRegisteredUsers == 4
    assert metrics.totalPaidUsers == 1
    assert metrics.totalUnpaidUsers == 3
    assert metrics.totalPremiumActiveUsers == 3
    assert metrics.totalFreeUsers == 1
    assert metrics.totalManualPremiumUsers == 1
    assert metrics.totalScholarshipUsers == 1
    assert metrics.currentlyActiveUsers == 1
    assert metrics.activeTodayUsers == 1
    assert metrics.inactiveUsers == 1
    assert metrics.nonSeriousUsers == 1


def test_create_user_record_rejects_duplicate_user_id(tmp_path):
    path = tmp_path / "users.json"
    user = build_test_user(user_id="duplicate-user")

    save_user_records([user], path)

    with pytest.raises(ValueError, match="User with this id already exists."):
        create_user_record(user, path)


def test_create_user_record_rejects_duplicate_phone_number(tmp_path):
    path = tmp_path / "users.json"
    user_one = build_test_user(user_id="user-one", phone_number="+919999999999")
    user_two = build_test_user(user_id="user-two", phone_number="+919999999999")

    save_user_records([user_one], path)

    with pytest.raises(ValueError, match="User with this phone number already exists."):
        create_user_record(user_two, path)
