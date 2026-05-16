from typing import Literal

from pydantic import BaseModel, Field


AuthProvider = Literal["phoneOtp", "email", "google", "apple"]
AuthAccountStatus = Literal["active", "pending", "blocked", "deleted"]
OtpPurpose = Literal["login", "signup"]
SessionStatus = Literal["active", "expired", "revoked"]


class AuthAccount(BaseModel):
    id: str
    userId: str
    phoneNumber: str
    email: str | None = None
    displayName: str | None = None
    authProvider: AuthProvider = "phoneOtp"
    accountStatus: AuthAccountStatus = "active"
    createdAt: str
    updatedAt: str
    lastLoginAt: str | None = None


class AuthAccountCreate(BaseModel):
    userId: str
    phoneNumber: str
    email: str | None = None
    displayName: str | None = None
    authProvider: AuthProvider = "phoneOtp"


class OtpRequest(BaseModel):
    phoneNumber: str = Field(min_length=4)
    purpose: OtpPurpose = "login"


class OtpVerificationRequest(BaseModel):
    phoneNumber: str = Field(min_length=4)
    otpCode: str = Field(min_length=4, max_length=8)
    purpose: OtpPurpose = "login"


class AuthSession(BaseModel):
    id: str
    userId: str
    authAccountId: str
    sessionToken: str
    refreshToken: str | None = None
    status: SessionStatus = "active"
    createdAt: str
    expiresAt: str
    revokedAt: str | None = None
    deviceLabel: str | None = None
