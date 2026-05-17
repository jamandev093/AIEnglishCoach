from fastapi import HTTPException, status

from user_schemas import AdminUserDetail, UserAccess
from user_store import USERS_PATH, load_user_records


ACCESS_GUARD_USER_STORE_PATH = USERS_PATH


def is_active_premium_access(access: UserAccess) -> bool:
    """Return True when user has active premium access."""

    return access.accessLevel == "premium" and access.accessStatus == "active"


def get_user_for_access_guard(user_id: str) -> AdminUserDetail:
    """Find one user by id for access checking."""

    normalized_user_id = user_id.strip()

    if not normalized_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User id is required.",
        )

    for user in load_user_records(ACCESS_GUARD_USER_STORE_PATH):
        if user.profile.id == normalized_user_id:
            return user

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found.",
    )


def can_use_premium_ai(user_id: str) -> bool:
    """Soft check: return whether a user can use premium AI features."""

    user = get_user_for_access_guard(user_id)

    return is_active_premium_access(user.access)


def require_premium_ai_access(user_id: str) -> AdminUserDetail:
    """Hard guard: require active premium access for premium AI work."""

    user = get_user_for_access_guard(user_id)

    if not is_active_premium_access(user.access):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium AI access required.",
        )

    return user
