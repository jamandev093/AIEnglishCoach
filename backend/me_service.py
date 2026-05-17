from fastapi import HTTPException, status

from user_store import USERS_PATH, load_user_records


ME_USER_STORE_PATH = USERS_PATH


def get_me_access_by_phone(phone_number: str) -> dict:
    """Return current user access state for mobile account foundation.

    Temporary foundation:
    - uses phone query
    - no real JWT/session yet
    - later replace with real authenticated user
    """

    normalized_phone = phone_number.strip()

    if not normalized_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is required.",
        )

    for user in load_user_records(ME_USER_STORE_PATH):
        if user.profile.phoneNumber == normalized_phone:
            access = user.access

            return {
                "success": True,
                "userId": user.profile.id,
                "phoneNumber": user.profile.phoneNumber,
                "displayName": user.profile.displayName,
                "accessLevel": access.accessLevel,
                "accessSource": access.accessSource,
                "accessStatus": access.accessStatus,
                "accessExpiresAt": access.accessExpiresAt,
                "courseId": access.courseId,
                "courseName": access.courseName,
                "isPremiumActive": (
                    access.accessLevel == "premium"
                    and access.accessStatus == "active"
                ),
            }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found.",
    )
