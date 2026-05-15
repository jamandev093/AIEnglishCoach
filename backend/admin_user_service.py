from fastapi import HTTPException, status

from user_schemas import AdminUserDetail, AdminUserSearchResponse, UserDashboardMetrics
from user_store import (
    USERS_PATH,
    calculate_user_dashboard_metrics,
    list_admin_user_summaries,
    load_user_records,
    search_users_by_phone_number,
)


USER_STORE_PATH = USERS_PATH


def list_admin_users() -> AdminUserSearchResponse:
    """Return all users as admin list rows."""

    return list_admin_user_summaries(USER_STORE_PATH)


def search_admin_users_by_phone(phone: str) -> AdminUserSearchResponse:
    """Search users by full or partial phone number."""

    if not phone.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone search query is required.",
        )

    return search_users_by_phone_number(phone, USER_STORE_PATH)


def get_admin_user_metrics() -> UserDashboardMetrics:
    """Return dashboard counts for paid, unpaid, active, inactive, non-serious users."""

    return calculate_user_dashboard_metrics(USER_STORE_PATH)


def get_admin_user_detail(user_id: str) -> AdminUserDetail:
    """Return one full admin user profile by user id."""

    for user in load_user_records(USER_STORE_PATH):
        if user.profile.id == user_id:
            return user

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found.",
    )
