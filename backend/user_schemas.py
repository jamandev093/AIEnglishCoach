from typing import List, Literal, Optional

from pydantic import BaseModel, Field


AccessLevel = Literal["free", "premium"]
AccessSource = Literal["none", "payment", "adminManual", "scholarship", "trial"]
AccessStatus = Literal["active", "expired", "revoked", "pending"]

UserActivityStatus = Literal[
    "currentlyActive",
    "practicingNow",
    "activeToday",
    "activeThisWeek",
    "inactive",
    "leftPlatform",
    "nonSerious",
    "serious",
]

EnglishLevel = Literal["beginner", "intermediate", "advanced"]
LanguageCode = Literal[
    "english",
    "hindi",
    "bengali",
    "marathi",
    "tamil",
    "telugu",
    "urdu",
    "gujarati",
    "other",
]


class UserAccess(BaseModel):
    accessLevel: AccessLevel = "free"
    accessSource: AccessSource = "none"
    accessStatus: AccessStatus = "active"
    accessExpiresAt: Optional[str] = None
    courseId: Optional[str] = None
    courseName: Optional[str] = None
    manualReason: Optional[str] = None
    grantedByAdminId: Optional[str] = None
    updatedAt: str


class UserProfile(BaseModel):
    id: str
    phoneNumber: str
    email: Optional[str] = None
    displayName: Optional[str] = None
    nativeLanguage: LanguageCode = "other"
    englishLevel: EnglishLevel = "beginner"
    createdAt: str
    updatedAt: str
    lastActiveAt: Optional[str] = None
    isActive: bool = True


class UserPerformance(BaseModel):
    userId: str
    confidenceScore: int = Field(default=0, ge=0, le=100)
    fluencyScore: int = Field(default=0, ge=0, le=100)
    pronunciationScore: int = Field(default=0, ge=0, le=100)
    grammarScore: int = Field(default=0, ge=0, le=100)
    speakingPracticeCount: int = Field(default=0, ge=0)
    topicsPracticed: int = Field(default=0, ge=0)
    storiesCompleted: int = Field(default=0, ge=0)
    readingListeningCompleted: int = Field(default=0, ge=0)
    confidenceMissionsCompleted: int = Field(default=0, ge=0)
    totalPracticeMinutes: int = Field(default=0, ge=0)
    lastPracticeAt: Optional[str] = None
    repeatedMistakes: List[str] = []
    updatedAt: str


class AdminUserSummary(BaseModel):
    id: str
    phoneNumber: str
    displayName: Optional[str] = None
    email: Optional[str] = None
    accessLevel: AccessLevel
    accessSource: AccessSource
    accessStatus: AccessStatus
    lastActiveAt: Optional[str] = None
    activityStatus: UserActivityStatus
    confidenceScore: int = Field(default=0, ge=0, le=100)
    fluencyScore: int = Field(default=0, ge=0, le=100)
    speakingPracticeCount: int = Field(default=0, ge=0)


class AdminUserDetail(BaseModel):
    profile: UserProfile
    access: UserAccess
    performance: UserPerformance
    activityStatus: UserActivityStatus
    adminNotes: List[str] = []


class AdminUserSearchResponse(BaseModel):
    success: bool
    count: int
    users: List[AdminUserSummary]


class UserDashboardMetrics(BaseModel):
    totalRegisteredUsers: int = Field(default=0, ge=0)
    totalPaidUsers: int = Field(default=0, ge=0)
    totalUnpaidUsers: int = Field(default=0, ge=0)
    totalPremiumActiveUsers: int = Field(default=0, ge=0)
    totalFreeUsers: int = Field(default=0, ge=0)
    totalManualPremiumUsers: int = Field(default=0, ge=0)
    totalScholarshipUsers: int = Field(default=0, ge=0)
    totalTrialUsers: int = Field(default=0, ge=0)
    totalExpiredPremiumUsers: int = Field(default=0, ge=0)
    currentlyActiveUsers: int = Field(default=0, ge=0)
    practicingNowUsers: int = Field(default=0, ge=0)
    activeTodayUsers: int = Field(default=0, ge=0)
    activeThisWeekUsers: int = Field(default=0, ge=0)
    inactiveUsers: int = Field(default=0, ge=0)
    leftPlatformUsers: int = Field(default=0, ge=0)
    nonSeriousUsers: int = Field(default=0, ge=0)
    seriousUsers: int = Field(default=0, ge=0)


class ManualAccessUpdateRequest(BaseModel):
    accessLevel: AccessLevel = "premium"
    accessSource: Literal["adminManual", "scholarship", "trial"]
    accessStatus: AccessStatus = "active"
    accessExpiresAt: Optional[str] = None
    courseId: Optional[str] = None
    courseName: Optional[str] = None
    manualReason: str


class CoursePricing(BaseModel):
    courseId: str
    courseName: str
    price: int = Field(ge=0)
    currency: str = "INR"
    discountPrice: Optional[int] = Field(default=None, ge=0)
    isActive: bool = True
    validFrom: str
    validUntil: Optional[str] = None
    updatedAt: str


AuthProvider = Literal["phoneOtp", "emailPassword", "google", "manualAdmin"]
AuthStatus = Literal["pending", "verified", "blocked"]
PaymentStatus = Literal["notPaid", "paid", "pending", "failed", "refunded"]
PaymentProvider = Literal["razorpay", "stripe", "manual", "none"]


class UserAuthAccount(BaseModel):
    userId: str
    phoneNumber: str
    email: Optional[str] = None
    authProvider: AuthProvider = "phoneOtp"
    authStatus: AuthStatus = "pending"
    phoneVerifiedAt: Optional[str] = None
    emailVerifiedAt: Optional[str] = None
    createdAt: str
    updatedAt: str


class UserRegistrationRequest(BaseModel):
    phoneNumber: str
    email: Optional[str] = None
    displayName: Optional[str] = None
    nativeLanguage: LanguageCode = "other"
    englishLevel: EnglishLevel = "beginner"


class UserLoginRequest(BaseModel):
    phoneNumber: str
    otpCode: Optional[str] = None


class UserAuthSession(BaseModel):
    userId: str
    accessToken: str
    refreshToken: Optional[str] = None
    expiresAt: str
    createdAt: str


class PaymentRecord(BaseModel):
    paymentId: str
    userId: str
    courseId: str
    courseName: str
    amount: int = Field(ge=0)
    currency: str = "INR"
    paymentStatus: PaymentStatus = "pending"
    paymentProvider: PaymentProvider = "none"
    providerReferenceId: Optional[str] = None
    paidAt: Optional[str] = None
    createdAt: str
    updatedAt: str


class UserPaymentSummary(BaseModel):
    userId: str
    paymentStatus: PaymentStatus = "notPaid"
    totalPaidAmount: int = Field(default=0, ge=0)
    activeCourseId: Optional[str] = None
    activeCourseName: Optional[str] = None
    lastPaymentAt: Optional[str] = None
