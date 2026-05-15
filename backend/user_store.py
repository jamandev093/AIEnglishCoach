import json
from pathlib import Path
from typing import List, Optional

from user_schemas import (
    AdminUserDetail,
    AdminUserSearchResponse,
    AdminUserSummary,
    UserAccess,
    UserDashboardMetrics,
    UserPerformance,
    UserProfile,
)


USER_DATA_DIR = Path(__file__).resolve().parent / "user_data"
USERS_PATH = USER_DATA_DIR / "users.json"


def _ensure_user_data_dir() -> None:
    USER_DATA_DIR.mkdir(parents=True, exist_ok=True)


def _model_to_dict(item):
    if hasattr(item, "model_dump"):
        return item.model_dump()

    return item.dict()


def load_user_records(path: Path = USERS_PATH) -> List[AdminUserDetail]:
    """Load all user records from JSON storage."""

    if not path.exists():
        return []

    raw_text = path.read_text(encoding="utf-8")

    if not raw_text.strip():
        return []

    raw_data = json.loads(raw_text)

    if isinstance(raw_data, dict):
        raw_users = raw_data.get("users", [])
    else:
        raw_users = raw_data

    if not isinstance(raw_users, list):
        raise ValueError("User JSON must contain a users list.")

    return [AdminUserDetail(**item) for item in raw_users]


def save_user_records(
    users: List[AdminUserDetail],
    path: Path = USERS_PATH,
) -> None:
    """Save user records to JSON storage using an atomic replace."""

    _ensure_user_data_dir()

    payload = {
        "users": [_model_to_dict(user) for user in users],
    }

    temp_path = path.with_suffix(".tmp")
    temp_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    temp_path.replace(path)


def find_user_by_phone_number(
    phone_number: str,
    path: Path = USERS_PATH,
) -> Optional[AdminUserDetail]:
    """Find one user by phone number."""

    normalized_phone = phone_number.strip()

    for user in load_user_records(path):
        if user.profile.phoneNumber == normalized_phone:
            return user

    return None


def search_users_by_phone_number(
    phone_number: str,
    path: Path = USERS_PATH,
) -> AdminUserSearchResponse:
    """Search users by exact or partial phone number."""

    query = phone_number.strip()

    matched_users = [
        build_admin_user_summary(user)
        for user in load_user_records(path)
        if query in user.profile.phoneNumber
    ]

    return AdminUserSearchResponse(
        success=True,
        count=len(matched_users),
        users=matched_users,
    )


def build_admin_user_summary(user: AdminUserDetail) -> AdminUserSummary:
    """Create a safe admin list-row summary from full user detail."""

    return AdminUserSummary(
        id=user.profile.id,
        phoneNumber=user.profile.phoneNumber,
        displayName=user.profile.displayName,
        email=user.profile.email,
        accessLevel=user.access.accessLevel,
        accessSource=user.access.accessSource,
        accessStatus=user.access.accessStatus,
        lastActiveAt=user.profile.lastActiveAt,
        activityStatus=user.activityStatus,
        confidenceScore=user.performance.confidenceScore,
        fluencyScore=user.performance.fluencyScore,
        speakingPracticeCount=user.performance.speakingPracticeCount,
    )


def list_admin_user_summaries(
    path: Path = USERS_PATH,
) -> AdminUserSearchResponse:
    """Return all users as admin summary rows."""

    users = [build_admin_user_summary(user) for user in load_user_records(path)]

    return AdminUserSearchResponse(
        success=True,
        count=len(users),
        users=users,
    )


def calculate_user_dashboard_metrics(
    path: Path = USERS_PATH,
) -> UserDashboardMetrics:
    """Calculate admin dashboard counts from user records."""

    users = load_user_records(path)

    total_registered = len(users)

    paid_users = [
        user
        for user in users
        if user.access.accessSource == "payment"
        and user.access.accessStatus == "active"
    ]

    premium_active_users = [
        user
        for user in users
        if user.access.accessLevel == "premium"
        and user.access.accessStatus == "active"
    ]

    free_users = [
        user
        for user in users
        if user.access.accessLevel == "free"
        and user.access.accessStatus == "active"
    ]

    manual_premium_users = [
        user
        for user in users
        if user.access.accessSource == "adminManual"
        and user.access.accessStatus == "active"
    ]

    scholarship_users = [
        user
        for user in users
        if user.access.accessSource == "scholarship"
        and user.access.accessStatus == "active"
    ]

    trial_users = [
        user
        for user in users
        if user.access.accessSource == "trial"
        and user.access.accessStatus == "active"
    ]

    expired_premium_users = [
        user
        for user in users
        if user.access.accessLevel == "premium"
        and user.access.accessStatus == "expired"
    ]

    currently_active_users = [
        user for user in users if user.activityStatus == "currentlyActive"
    ]

    practicing_now_users = [
        user for user in users if user.activityStatus == "practicingNow"
    ]

    active_today_users = [
        user for user in users if user.activityStatus == "activeToday"
    ]

    active_this_week_users = [
        user for user in users if user.activityStatus == "activeThisWeek"
    ]

    inactive_users = [user for user in users if user.activityStatus == "inactive"]

    left_platform_users = [
        user for user in users if user.activityStatus == "leftPlatform"
    ]

    non_serious_users = [
        user for user in users if user.activityStatus == "nonSerious"
    ]

    serious_users = [user for user in users if user.activityStatus == "serious"]

    unpaid_users_count = total_registered - len(paid_users)

    return UserDashboardMetrics(
        totalRegisteredUsers=total_registered,
        totalPaidUsers=len(paid_users),
        totalUnpaidUsers=unpaid_users_count,
        totalPremiumActiveUsers=len(premium_active_users),
        totalFreeUsers=len(free_users),
        totalManualPremiumUsers=len(manual_premium_users),
        totalScholarshipUsers=len(scholarship_users),
        totalTrialUsers=len(trial_users),
        totalExpiredPremiumUsers=len(expired_premium_users),
        currentlyActiveUsers=len(currently_active_users),
        practicingNowUsers=len(practicing_now_users),
        activeTodayUsers=len(active_today_users),
        activeThisWeekUsers=len(active_this_week_users),
        inactiveUsers=len(inactive_users),
        leftPlatformUsers=len(left_platform_users),
        nonSeriousUsers=len(non_serious_users),
        seriousUsers=len(serious_users),
    )


def create_user_record(
    user: AdminUserDetail,
    path: Path = USERS_PATH,
) -> AdminUserDetail:
    """Create one user record. Duplicate user IDs or phone numbers are rejected."""

    users = load_user_records(path)

    if any(existing.profile.id == user.profile.id for existing in users):
        raise ValueError("User with this id already exists.")

    if any(existing.profile.phoneNumber == user.profile.phoneNumber for existing in users):
        raise ValueError("User with this phone number already exists.")

    users.append(user)
    save_user_records(users, path)

    return user
