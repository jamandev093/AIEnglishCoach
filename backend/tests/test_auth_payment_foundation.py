import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from user_schemas import (  # noqa: E402
    PaymentRecord,
    UserAuthAccount,
    UserLoginRequest,
    UserPaymentSummary,
    UserRegistrationRequest,
)


def test_user_registration_request_supports_phone_first_auth():
    request = UserRegistrationRequest(
        phoneNumber="+919876543210",
        displayName="Student",
        nativeLanguage="hindi",
        englishLevel="beginner",
    )

    assert request.phoneNumber == "+919876543210"
    assert request.email is None
    assert request.nativeLanguage == "hindi"


def test_user_login_request_supports_future_phone_otp():
    request = UserLoginRequest(
        phoneNumber="+919876543210",
        otpCode="123456",
    )

    assert request.phoneNumber == "+919876543210"
    assert request.otpCode == "123456"


def test_user_auth_account_tracks_verification_status():
    account = UserAuthAccount(
        userId="user-001",
        phoneNumber="+919876543210",
        authProvider="phoneOtp",
        authStatus="verified",
        phoneVerifiedAt="2026-05-15T00:00:00Z",
        createdAt="2026-05-15T00:00:00Z",
        updatedAt="2026-05-15T00:00:00Z",
    )

    assert account.authProvider == "phoneOtp"
    assert account.authStatus == "verified"


def test_payment_record_supports_future_gateway_foundation():
    payment = PaymentRecord(
        paymentId="pay-001",
        userId="user-001",
        courseId="premium-speaking-v1",
        courseName="Premium Speaking Course",
        amount=499,
        currency="INR",
        paymentStatus="paid",
        paymentProvider="razorpay",
        providerReferenceId="rzp-001",
        paidAt="2026-05-15T00:00:00Z",
        createdAt="2026-05-15T00:00:00Z",
        updatedAt="2026-05-15T00:00:00Z",
    )

    assert payment.paymentStatus == "paid"
    assert payment.paymentProvider == "razorpay"
    assert payment.amount == 499


def test_user_payment_summary_supports_paid_unpaid_dashboard():
    summary = UserPaymentSummary(
        userId="user-001",
        paymentStatus="notPaid",
        totalPaidAmount=0,
        activeCourseId=None,
        activeCourseName=None,
        lastPaymentAt=None,
    )

    assert summary.paymentStatus == "notPaid"
    assert summary.totalPaidAmount == 0
