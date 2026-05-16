from fastapi.testclient import TestClient

from auth_schemas import AuthAccount, OtpVerificationRequest
from auth_service import MOCK_OTP_CODE, request_mock_otp, verify_mock_otp
from auth_store import save_auth_accounts
from main import app


client = TestClient(app)


def test_request_otp_endpoint_returns_mock_otp():
    response = client.post(
        "/auth/request-otp",
        json={"phoneNumber": "9876543210", "purpose": "login"},
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["phoneNumber"] == "9876543210"
    assert data["purpose"] == "login"
    assert data["mockOtp"] == "123456"


def test_request_otp_endpoint_normalizes_phone_number():
    response = client.post(
        "/auth/request-otp",
        json={"phoneNumber": "+91 98765-43210", "purpose": "login"},
    )

    assert response.status_code == 200

    data = response.json()

    assert data["phoneNumber"] == "919876543210"


def test_verify_otp_endpoint_success_for_existing_account():
    response = client.post(
        "/auth/verify-otp",
        json={
            "phoneNumber": "9876543210",
            "otpCode": "123456",
            "purpose": "login",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["authAccount"]["id"] == "auth-001"
    assert data["authAccount"]["userId"] == "user-001"
    assert data["session"]["sessionToken"] == "mock-session-token-auth-001"
    assert data["session"]["tokenType"] == "mock"


def test_verify_otp_endpoint_rejects_wrong_otp():
    response = client.post(
        "/auth/verify-otp",
        json={
            "phoneNumber": "9876543210",
            "otpCode": "000000",
            "purpose": "login",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid OTP."


def test_verify_otp_endpoint_returns_404_for_unknown_phone():
    response = client.post(
        "/auth/verify-otp",
        json={
            "phoneNumber": "0000000000",
            "otpCode": "123456",
            "purpose": "login",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Auth account not found."


def test_verify_mock_otp_rejects_blocked_account(tmp_path):
    store_path = tmp_path / "auth_accounts.json"

    blocked_account = AuthAccount(
        id="auth-blocked-001",
        userId="user-blocked-001",
        phoneNumber="7777777777",
        email=None,
        displayName="Blocked User",
        authProvider="phoneOtp",
        accountStatus="blocked",
        createdAt="2026-05-16T00:00:00Z",
        updatedAt="2026-05-16T00:00:00Z",
        lastLoginAt=None,
    )

    save_auth_accounts([blocked_account], store_path)

    result = verify_mock_otp(
        OtpVerificationRequest(
            phoneNumber="7777777777",
            otpCode=MOCK_OTP_CODE,
            purpose="login",
        ),
        store_path,
    )

    assert result["success"] is False
    assert result["statusCode"] == 403
    assert result["message"] == "Account is not active."


def test_request_mock_otp_service_foundation():
    result = request_mock_otp(
        request=type(
            "OtpRequestObject",
            (),
            {"phoneNumber": "+91 98765 43210", "purpose": "signup"},
        )()
    )

    assert result["success"] is True
    assert result["phoneNumber"] == "919876543210"
    assert result["purpose"] == "signup"
    assert result["mockOtp"] == MOCK_OTP_CODE
