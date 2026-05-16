import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AccessControlUser } from "./accessControl";

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
  | "blocked"
  | "pending";

export type MobileAccountAccess = {
  isLoggedIn: boolean;
  userId: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  accessLevel: MobileAccessLevel;
  accessSource: MobileAccessSource;
  accessStatus: MobileAccessStatus;
  accessExpiresAt: string | null;
};

const ACCOUNT_ACCESS_STORAGE_KEY = "AI_ENGLISH_COACH_ACCOUNT_ACCESS_V1";

export function getDefaultGuestAccess(): MobileAccountAccess {
  return {
    isLoggedIn: false,
    userId: null,
    phoneNumber: null,
    displayName: null,
    accessLevel: "free",
    accessSource: "none",
    accessStatus: "active",
    accessExpiresAt: null,
  };
}

export function isLoggedIn(access: MobileAccountAccess): boolean {
  return access.isLoggedIn && Boolean(access.userId);
}

export function hasActivePremiumAccess(access: MobileAccountAccess): boolean {
  return access.accessLevel === "premium" && access.accessStatus === "active";
}

export function toAccessControlUser(
  access: MobileAccountAccess
): AccessControlUser {
  return {
    accessLevel: access.accessLevel,
    accessSource: access.accessSource,
    accessStatus: access.accessStatus,
    accessExpiresAt: access.accessExpiresAt,
  };
}

function normalizeAccountAccess(value: Partial<MobileAccountAccess> | null) {
  const defaultAccess = getDefaultGuestAccess();

  if (!value) {
    return defaultAccess;
  }

  return {
    ...defaultAccess,
    ...value,
    isLoggedIn: Boolean(value.isLoggedIn),
    userId: value.userId ?? null,
    phoneNumber: value.phoneNumber ?? null,
    displayName: value.displayName ?? null,
    accessLevel: value.accessLevel ?? defaultAccess.accessLevel,
    accessSource: value.accessSource ?? defaultAccess.accessSource,
    accessStatus: value.accessStatus ?? defaultAccess.accessStatus,
    accessExpiresAt: value.accessExpiresAt ?? null,
  };
}

export async function getCurrentAccountAccess(): Promise<MobileAccountAccess> {
  try {
    const rawValue = await AsyncStorage.getItem(ACCOUNT_ACCESS_STORAGE_KEY);

    if (!rawValue) {
      return getDefaultGuestAccess();
    }

    const parsedValue = JSON.parse(rawValue) as Partial<MobileAccountAccess>;

    return normalizeAccountAccess(parsedValue);
  } catch (error) {
    console.log("Failed to load account access:", error);
    return getDefaultGuestAccess();
  }
}

export async function saveCurrentAccountAccess(
  access: MobileAccountAccess
): Promise<void> {
  try {
    const normalizedAccess = normalizeAccountAccess(access);

    await AsyncStorage.setItem(
      ACCOUNT_ACCESS_STORAGE_KEY,
      JSON.stringify(normalizedAccess)
    );
  } catch (error) {
    console.log("Failed to save account access:", error);
  }
}

export async function clearCurrentAccountAccess(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ACCOUNT_ACCESS_STORAGE_KEY);
  } catch (error) {
    console.log("Failed to clear account access:", error);
  }
}

export async function saveMockLoggedInFreeAccess(params: {
  userId: string;
  phoneNumber: string;
  displayName?: string | null;
}): Promise<MobileAccountAccess> {
  const access: MobileAccountAccess = {
    isLoggedIn: true,
    userId: params.userId,
    phoneNumber: params.phoneNumber,
    displayName: params.displayName ?? null,
    accessLevel: "free",
    accessSource: "none",
    accessStatus: "active",
    accessExpiresAt: null,
  };

  await saveCurrentAccountAccess(access);

  return access;
}

export async function saveMockPremiumAccess(params: {
  userId: string;
  phoneNumber: string;
  displayName?: string | null;
  accessSource?: Exclude<MobileAccessSource, "none">;
  accessExpiresAt?: string | null;
}): Promise<MobileAccountAccess> {
  const access: MobileAccountAccess = {
    isLoggedIn: true,
    userId: params.userId,
    phoneNumber: params.phoneNumber,
    displayName: params.displayName ?? null,
    accessLevel: "premium",
    accessSource: params.accessSource ?? "adminManual",
    accessStatus: "active",
    accessExpiresAt: params.accessExpiresAt ?? null,
  };

  await saveCurrentAccountAccess(access);

  return access;
}
