import pytest
from pydantic import ValidationError

from auth_schemas import AuthAccount, AuthSession, OtpRequest, OtpVerificationRequest
from auth_store import (
    create_auth_account,
    find_auth_account_by_phone,
    find_auth_account_by_user_id,
    load_auth_accounts,
    normalize_phone_number,
    save_auth_accounts,
)


def make_auth_account(
    account_id="auth-test-001",
    user_id="user-test-001",
    phone_number="9876543210",
):
    return AuthAccount(
        id=account_id,
        userId=user_id,
        phoneNumber=phone_number,
        email=None,
        displayName="Test User",
        authProvider="phoneOtp",
        accountStatus="active",
        createdAt="2026-05-16T00:00:00Z",
        updatedAt="2026-05-16T00:00:00Z",
        lastLoginAt=None,
    )


def test_normalize_phone_number_keeps_digits_only():
    assert normalize_phone_number("+91 98765-43210") == "919876543210"
    assert normalize_phone_number("987 654 3210") == "9876543210"


def test_load_auth_accounts_returns_empty_list_for_missing_file(tmp_path):
    store_path = tmp_path / "missing_auth_accounts.json"

    assert load_auth_accounts(store_path) == []


def test_save_and_load_auth_accounts(tmp_path):
    store_path = tmp_path / "auth_accounts.json"
    account = make_auth_account()

    save_auth_accounts([account], store_path)
    loaded_accounts = load_auth_accounts(store_path)

    assert len(loaded_accounts) == 1
    assert loaded_accounts[0].id == "auth-test-001"
    assert loaded_accounts[0].userId == "user-test-001"
    assert loaded_accounts[0].phoneNumber == "9876543210"


def test_find_auth_account_by_phone(tmp_path):
    store_path = tmp_path / "auth_accounts.json"
    account = make_auth_account(phone_number="+91 98765 43210")

    save_auth_accounts([account], store_path)

    found = find_auth_account_by_phone("919876543210", store_path)

    assert found is not None
    assert found.id == "auth-test-001"


def test_find_auth_account_by_phone_returns_none_for_missing_phone(tmp_path):
    store_path = tmp_path / "auth_accounts.json"
    account = make_auth_account()

    save_auth_accounts([account], store_path)

    assert find_auth_account_by_phone("0000000000", store_path) is None


def test_find_auth_account_by_user_id(tmp_path):
    store_path = tmp_path / "auth_accounts.json"
    account = make_auth_account(user_id="user-test-999")

    save_auth_accounts([account], store_path)

    found = find_auth_account_by_user_id("user-test-999", store_path)

    assert found is not None
    assert found.phoneNumber == "9876543210"


def test_find_auth_account_by_user_id_returns_none_for_missing_user(tmp_path):
    store_path = tmp_path / "auth_accounts.json"
    account = make_auth_account()

    save_auth_accounts([account], store_path)

    assert find_auth_account_by_user_id("missing-user", store_path) is None


def test_create_auth_account_adds_new_account(tmp_path):
    store_path = tmp_path / "auth_accounts.json"
    account = make_auth_account()

    created = create_auth_account(account, store_path)
    loaded_accounts = load_auth_accounts(store_path)

    assert created.id == "auth-test-001"
    assert len(loaded_accounts) == 1
    assert loaded_accounts[0].userId == "user-test-001"


def test_create_auth_account_rejects_duplicate_phone(tmp_path):
    store_path = tmp_path / "auth_accounts.json"
    first = make_auth_account(account_id="auth-1", user_id="user-1")
    second = make_auth_account(account_id="auth-2", user_id="user-2")

    create_auth_account(first, store_path)

    with pytest.raises(ValueError, match="phone number already exists"):
        create_auth_account(second, store_path)


def test_create_auth_account_rejects_duplicate_user_id(tmp_path):
    store_path = tmp_path / "auth_accounts.json"
    first = make_auth_account(account_id="auth-1", user_id="user-1", phone_number="1111")
    second = make_auth_account(account_id="auth-2", user_id="user-1", phone_number="2222")

    create_auth_account(first, store_path)

    with pytest.raises(ValueError, match="userId already exists"):
        create_auth_account(second, store_path)


def test_otp_request_schema_accepts_login_request():
    request = OtpRequest(phoneNumber="9876543210", purpose="login")

    assert request.phoneNumber == "9876543210"
    assert request.purpose == "login"


def test_otp_verification_schema_accepts_signup_request():
    request = OtpVerificationRequest(
        phoneNumber="9876543210",
        otpCode="123456",
        purpose="signup",
    )

    assert request.otpCode == "123456"
    assert request.purpose == "signup"


def test_otp_verification_rejects_short_otp_code():
    with pytest.raises(ValidationError):
        OtpVerificationRequest(
            phoneNumber="9876543210",
            otpCode="12",
            purpose="login",
        )


def test_auth_session_schema_foundation():
    session = AuthSession(
        id="session-001",
        userId="user-001",
        authAccountId="auth-001",
        sessionToken="test-session-token",
        refreshToken=None,
        status="active",
        createdAt="2026-05-16T00:00:00Z",
        expiresAt="2026-06-16T00:00:00Z",
        revokedAt=None,
        deviceLabel="Android test device",
    )

    assert session.userId == "user-001"
    assert session.status == "active"
    assert session.deviceLabel == "Android test device"
