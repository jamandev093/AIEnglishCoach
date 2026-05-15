import sys
from pathlib import Path

import pytest
from pydantic import ValidationError


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from user_schemas import (  # noqa: E402
    AdminUserDetail,
    AdminUserSearchResponse,
    AdminUserSummary,
    CoursePricing,
    ManualAccessUpdateRequest,
    UserAccess,
    UserDashboardMetrics,
    UserPerformance,
    UserProfile,
)


def build_profile() -> UserProfile:
    return UserProfile(
        id="user-001",
        phoneNumber="+919876543210",
        email=None,
        displayName="Student",
        nativeLanguage="hindi",
        englishLevel="beginner",
        createdAt="2026-05-15T00:00:00Z",
        updatedAt="2026-05-15T00:00:00Z",
        lastActiveAt="2026-05-15T00:00:00Z",
        isActive=True,
    )


def build_access() -> UserAccess:
    return UserAccess(
        accessLevel="premium",
        accessSource="scholarship",
        accessStatus="active",
        accessExpiresAt="2026-08-15T00:00:00Z",
        courseId="premium-speaking-v1",
        courseName="Premium Speaking Course",
        manualReason="Poor-student free access",
        grantedByAdminId="admin-001",
        updatedAt="2026-05-15T00:00:00Z",
    )


def build_performance() -> UserPerformance:
    return UserPerformance(
        userId="user-001",
        confidenceScore=62,
        fluencyScore=58,
        pronunciationScore=64,
        grammarScore=60,
        speakingPracticeCount=18,
        topicsPracticed=4,
        storiesCompleted=2,
        readingListeningCompleted=1,
        confidenceMissionsCompleted=3,
        totalPracticeMinutes=95,
        lastPracticeAt="2026-05-15T00:00:00Z",
        repeatedMistakes=["missing to", "wrong tense"],
        updatedAt="2026-05-15T00:00:00Z",
    )


def test_user_profile_supports_phone_number_primary_identity():
    profile = build_profile()

    assert profile.phoneNumber == "+919876543210"
    assert profile.email is None
    assert profile.nativeLanguage == "hindi"


def test_user_access_supports_scholarship_free_access():
    access = build_access()

    assert access.accessLevel == "premium"
    assert access.accessSource == "scholarship"
    assert access.accessStatus == "active"
    assert access.manualReason == "Poor-student free access"


def test_manual_access_update_supports_admin_manual_and_scholarship():
    admin_manual = ManualAccessUpdateRequest(
        accessSource="adminManual",
        manualReason="Owner activated premium manually.",
    )
    scholarship = ManualAccessUpdateRequest(
        accessSource="scholarship",
        manualReason="Student cannot pay.",
    )

    assert admin_manual.accessLevel == "premium"
    assert scholarship.accessSource == "scholarship"


def test_user_performance_tracks_learning_metrics():
    performance = build_performance()

    assert performance.confidenceScore == 62
    assert performance.fluencyScore == 58
    assert performance.speakingPracticeCount == 18
    assert "wrong tense" in performance.repeatedMistakes


def test_score_fields_reject_invalid_values():
    with pytest.raises(ValidationError):
        UserPerformance(
            userId="user-001",
            confidenceScore=101,
            fluencyScore=0,
            pronunciationScore=0,
            grammarScore=0,
            updatedAt="2026-05-15T00:00:00Z",
        )


def test_admin_user_summary_contains_search_list_fields():
    summary = AdminUserSummary(
        id="user-001",
        phoneNumber="+919876543210",
        displayName="Student",
        email=None,
        accessLevel="premium",
        accessSource="payment",
        accessStatus="active",
        lastActiveAt="2026-05-15T00:00:00Z",
        activityStatus="currentlyActive",
        confidenceScore=70,
        fluencyScore=65,
        speakingPracticeCount=22,
    )

    assert summary.phoneNumber == "+919876543210"
    assert summary.accessSource == "payment"
    assert summary.activityStatus == "currentlyActive"


def test_admin_user_detail_combines_profile_access_and_performance():
    detail = AdminUserDetail(
        profile=build_profile(),
        access=build_access(),
        performance=build_performance(),
        activityStatus="serious",
        adminNotes=["Good progress"],
    )

    assert detail.profile.id == "user-001"
    assert detail.access.accessSource == "scholarship"
    assert detail.performance.topicsPracticed == 4
    assert detail.activityStatus == "serious"


def test_admin_user_search_response_supports_filtered_lists():
    summary = AdminUserSummary(
        id="user-001",
        phoneNumber="+919876543210",
        accessLevel="free",
        accessSource="none",
        accessStatus="active",
        activityStatus="nonSerious",
    )

    response = AdminUserSearchResponse(success=True, count=1, users=[summary])

    assert response.success is True
    assert response.count == 1
    assert response.users[0].activityStatus == "nonSerious"


def test_user_dashboard_metrics_supports_required_admin_counts():
    metrics = UserDashboardMetrics(
        totalRegisteredUsers=100,
        totalPaidUsers=25,
        totalUnpaidUsers=75,
        totalPremiumActiveUsers=30,
        totalFreeUsers=70,
        totalManualPremiumUsers=3,
        totalScholarshipUsers=2,
        currentlyActiveUsers=8,
        practicingNowUsers=4,
        inactiveUsers=20,
        leftPlatformUsers=7,
        nonSeriousUsers=15,
        seriousUsers=12,
    )

    assert metrics.totalPaidUsers == 25
    assert metrics.totalUnpaidUsers == 75
    assert metrics.totalScholarshipUsers == 2
    assert metrics.practicingNowUsers == 4
    assert metrics.nonSeriousUsers == 15


def test_course_pricing_supports_dynamic_fees():
    pricing = CoursePricing(
        courseId="premium-speaking-v1",
        courseName="Premium Speaking Course",
        price=499,
        currency="INR",
        discountPrice=199,
        isActive=True,
        validFrom="2026-05-15T00:00:00Z",
        validUntil=None,
        updatedAt="2026-05-15T00:00:00Z",
    )

    assert pricing.price == 499
    assert pricing.discountPrice == 199
    assert pricing.currency == "INR"
