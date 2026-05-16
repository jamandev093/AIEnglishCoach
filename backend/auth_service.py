from pathlib import Path
from typing import Any

from auth_schemas import OtpRequest, OtpVerificationRequest
from auth_store import AUTH_ACCOUNT_STORE_PATH, find_auth_account_by_phone, normalize_phone_number


MOCK_OTP_CODE = "123456"


def request_mock_otp(request: OtpRequest) -> dict[str, Any]:
    """Mock OTP request foundation.

    This does not send real SMS.
    Do not use mockOtp in production.
    """

    normalized_phone = normalize_phone_number(request.phoneNumber)

    return {
        "success": True,
        "message": "Mock OTP sent.",
        "phoneNumber": normalized_phone,
        "purpose": request.purpose,
        "mockOtp": MOCK_OTP_CODE,
    }


def verify_mock_otp(
    request: OtpVerificationRequest,
    path: Path | str = AUTH_ACCOUNT_STORE_PATH,
) -> dict[str, Any]:
    """Mock OTP verification foundation.

    This only verifies existing auth accounts.
    New user auto-creation will be added in a later phase.
    """

    normalized_phone = normalize_phone_number(request.phoneNumber)

    if request.otpCode != MOCK_OTP_CODE:
        return {
            "success": False,
            "statusCode": 401,
            "message": "Invalid OTP.",
        }

    auth_account = find_auth_account_by_phone(normalized_phone, path)

    if auth_account is None:
        return {
            "success": False,
            "statusCode": 404,
            "message": "Auth account not found.",
        }

    if auth_account.accountStatus != "active":
        return {
            "success": False,
            "statusCode": 403,
            "message": "Account is not active.",
        }

    return {
        "success": True,
        "message": "Mock OTP verified.",
        "authAccount": {
            "id": auth_account.id,
            "userId": auth_account.userId,
            "phoneNumber": normalize_phone_number(auth_account.phoneNumber),
            "displayName": auth_account.displayName,
            "accountStatus": auth_account.accountStatus,
        },
        "session": {
            "sessionToken": f"mock-session-token-{auth_account.id}",
            "tokenType": "mock",
        },
    }
