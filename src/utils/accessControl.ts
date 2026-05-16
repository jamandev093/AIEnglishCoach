export type MobileAccessLevel = "free" | "premium";

export type MobileAccessSource =
  | "none"
  | "payment"
  | "adminManual"
  | "scholarship"
  | "trial";

export type MobileAccessStatus =
  | "active"
  | "expired"
  | "revoked"
  | "pending"
  | "unknown";

export type MobileUserAccess = {
  accessLevel: MobileAccessLevel;
  accessSource: MobileAccessSource;
  accessStatus: MobileAccessStatus;
  accessExpiresAt?: string | null;
};

export type PremiumContentInfo = {
  isPremium?: boolean | null;
  title?: string;
};

export type AccessDecisionReason =
  | "freeContent"
  | "premiumActive"
  | "premiumRequired"
  | "accessExpired"
  | "accessRevoked"
  | "accessPending"
  | "accessUnknown";

export type AccessDecision = {
  allowed: boolean;
  isLocked: boolean;
  reason: AccessDecisionReason;
  message: string;
};

export const DEFAULT_LOCAL_USER_ACCESS: MobileUserAccess = {
  accessLevel: "free",
  accessSource: "none",
  accessStatus: "active",
  accessExpiresAt: null,
};

export const PREMIUM_TEST_ACCESS: MobileUserAccess = {
  accessLevel: "premium",
  accessSource: "payment",
  accessStatus: "active",
  accessExpiresAt: null,
};

export const SCHOLARSHIP_TEST_ACCESS: MobileUserAccess = {
  accessLevel: "premium",
  accessSource: "scholarship",
  accessStatus: "active",
  accessExpiresAt: null,
};

export const MANUAL_PREMIUM_TEST_ACCESS: MobileUserAccess = {
  accessLevel: "premium",
  accessSource: "adminManual",
  accessStatus: "active",
  accessExpiresAt: null,
};

export const EXPIRED_TEST_ACCESS: MobileUserAccess = {
  accessLevel: "premium",
  accessSource: "payment",
  accessStatus: "expired",
  accessExpiresAt: null,
};

export function isPremiumAccessActive(
  userAccess: MobileUserAccess | null | undefined,
): boolean {
  if (!userAccess) {
    return false;
  }

  return (
    userAccess.accessLevel === "premium" &&
    userAccess.accessStatus === "active"
  );
}

export function canAccessContent(
  content: PremiumContentInfo,
  userAccess: MobileUserAccess | null | undefined = DEFAULT_LOCAL_USER_ACCESS,
): AccessDecision {
  const isPremiumContent = Boolean(content.isPremium);

  if (!isPremiumContent) {
    return {
      allowed: true,
      isLocked: false,
      reason: "freeContent",
      message: "This practice is available for free.",
    };
  }

  if (isPremiumAccessActive(userAccess)) {
    return {
      allowed: true,
      isLocked: false,
      reason: "premiumActive",
      message: "Premium access is active.",
    };
  }

  if (!userAccess) {
    return {
      allowed: false,
      isLocked: true,
      reason: "accessUnknown",
      message:
        "This is a premium practice. Account access will be added soon.",
    };
  }

  if (userAccess.accessStatus === "expired") {
    return {
      allowed: false,
      isLocked: true,
      reason: "accessExpired",
      message:
        "Your premium access has expired. Continue free practice for now.",
    };
  }

  if (userAccess.accessStatus === "revoked") {
    return {
      allowed: false,
      isLocked: true,
      reason: "accessRevoked",
      message:
        "Premium access is not active. Continue free practice for now.",
    };
  }

  if (userAccess.accessStatus === "pending") {
    return {
      allowed: false,
      isLocked: true,
      reason: "accessPending",
      message:
        "Premium access is pending. Continue free practice for now.",
    };
  }

  return {
    allowed: false,
    isLocked: true,
    reason: "premiumRequired",
    message:
      "This practice is part of Premium. Payment and account access will be added soon. Continue free practice for now.",
  };
}

export function shouldShowPremiumBadge(content: PremiumContentInfo): boolean {
  return Boolean(content.isPremium);
}

export function getAccessBadgeLabel(
  content: PremiumContentInfo,
  userAccess: MobileUserAccess | null | undefined = DEFAULT_LOCAL_USER_ACCESS,
): string {
  if (!content.isPremium) {
    return "Free";
  }

  if (isPremiumAccessActive(userAccess)) {
    if (userAccess?.accessSource === "scholarship") {
      return "Premium • Scholarship";
    }

    if (userAccess?.accessSource === "adminManual") {
      return "Premium • Manual";
    }

    if (userAccess?.accessSource === "trial") {
      return "Premium • Trial";
    }

    return "Premium";
  }

  return "Locked Premium";
}

export function getPremiumLockTitle(content?: PremiumContentInfo): string {
  if (content?.title) {
    return `${content.title} is Premium`;
  }

  return "Premium Practice";
}

export function getPremiumLockMessage(
  content: PremiumContentInfo,
  userAccess: MobileUserAccess | null | undefined = DEFAULT_LOCAL_USER_ACCESS,
): string {
  return canAccessContent(content, userAccess).message;
}
