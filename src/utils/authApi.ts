import { API_BASE_URL } from "../config/api";

export type AuthPurpose = "login" | "signup";

export type AuthRequestOtpResponse = {
  success: boolean;
  message: string;
  phoneNumber: string;
  purpose: AuthPurpose;
  mockOtp?: string;
};

export type AuthAccountSummary = {
  id: string;
  userId: string;
  phoneNumber: string;
  displayName: string | null;
  accountStatus: string;
};

export type AuthSessionSummary = {
  sessionToken: string;
  tokenType: "mock" | string;
};

export type AuthVerifyOtpResponse = {
  success: boolean;
  message: string;
  authAccount: AuthAccountSummary;
  session: AuthSessionSummary;
};

async function readApiError(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (typeof data?.message === "string") {
      return data.message;
    }

    return `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

function assertPhoneNumber(phoneNumber: string) {
  if (!phoneNumber.trim()) {
    throw new Error("Phone number is required.");
  }
}

function assertOtpCode(otpCode: string) {
  if (!otpCode.trim()) {
    throw new Error("OTP code is required.");
  }
}

export async function requestMockOtp(
  phoneNumber: string,
  purpose: AuthPurpose = "login"
): Promise<AuthRequestOtpResponse> {
  assertPhoneNumber(phoneNumber);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber,
        purpose,
      }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    return (await response.json()) as AuthRequestOtpResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Unable to request OTP. Please try again.");
  }
}

export async function verifyMockOtp(
  phoneNumber: string,
  otpCode: string,
  purpose: AuthPurpose = "login"
): Promise<AuthVerifyOtpResponse> {
  assertPhoneNumber(phoneNumber);
  assertOtpCode(otpCode);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber,
        otpCode,
        purpose,
      }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    return (await response.json()) as AuthVerifyOtpResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Unable to verify OTP. Please try again.");
  }
}
