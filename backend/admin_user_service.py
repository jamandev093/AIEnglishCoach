from fastapi import HTTPException, status

from user_schemas import AdminUserDetail, AdminUserSearchResponse, ManualAccessUpdateRequest, UserAccess, UserDashboardMetrics
from user_store import (
    USERS_PATH,
    calculate_user_dashboard_metrics,
    list_admin_user_summaries,
    load_user_records,
    save_user_records,
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


def update_admin_user_access(
    user_id: str,
    access_update: ManualAccessUpdateRequest,
) -> AdminUserDetail:
    """Update user premium/free access from admin.

    This supports:
    - manual premium activation
    - scholarship / poor-student free access
    - trial access

    It does not process real payments.
    """

    users = load_user_records(USER_STORE_PATH)

    for index, user in enumerate(users):
        if user.profile.id == user_id:
            updated_access = UserAccess(
                accessLevel=access_update.accessLevel,
                accessSource=access_update.accessSource,
                accessStatus=access_update.accessStatus,
                accessExpiresAt=access_update.accessExpiresAt,
                courseId=access_update.courseId,
                courseName=access_update.courseName,
                manualReason=access_update.manualReason,
                grantedByAdminId="admin-local-foundation",
                updatedAt=user.profile.updatedAt,
            )

            user.access = updated_access
            users[index] = user
            save_user_records(users, USER_STORE_PATH)
            return user

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found.",
    )


def set_admin_user_access_status(
    user_id: str,
    access_status: str,
) -> AdminUserDetail:
    """Set access status to revoked or expired without deleting the user."""

    users = load_user_records(USER_STORE_PATH)

    for index, user in enumerate(users):
        if user.profile.id == user_id:
            access_data = (
                user.access.model_dump()
                if hasattr(user.access, "model_dump")
                else user.access.dict()
            )
            access_data["accessStatus"] = access_status
            access_data["updatedAt"] = user.profile.updatedAt

            user.access = UserAccess(**access_data)
            users[index] = user
            save_user_records(users, USER_STORE_PATH)
            return user

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found.",
    )


def restore_admin_user_free_access(user_id: str) -> AdminUserDetail:
    """Restore one user to normal free active access.

    This is an admin cleanup action for manual premium/scholarship/revoked users.
    It preserves profile, performance, activity status, and admin notes.
    """

    users = load_user_records(USER_STORE_PATH)

    for index, user in enumerate(users):
        if user.profile.id == user_id:
            restored_access = UserAccess(
                accessLevel="free",
                accessSource="none",
                accessStatus="active",
                accessExpiresAt=None,
                courseId=None,
                courseName=None,
                manualReason=None,
                grantedByAdminId=None,
                updatedAt=user.profile.updatedAt,
            )

            user.access = restored_access
            users[index] = user
            save_user_records(users, USER_STORE_PATH)
            return user

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found.",
    )
