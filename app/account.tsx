import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  requestMockOtp,
  verifyMockOtp,
  type AuthRequestOtpResponse,
} from "../src/utils/authApi";
import {
  clearCurrentAccountAccess,
  getCurrentAccountAccess,
  saveMockLoggedInFreeAccess,
  type MobileAccountAccess,
} from "../src/utils/accountAccessStore";

const ACTION_COLOR = "#8499DC";
const ERROR_COLOR = "#DC2626";
const SUCCESS_COLOR = "#16A34A";

export default function AccountScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [mockOtpResponse, setMockOtpResponse] =
    useState<AuthRequestOtpResponse | null>(null);
  const [accountAccess, setAccountAccess] =
    useState<MobileAccountAccess | null>(null);

  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState("");

  const loadAccountAccess = async () => {
    const currentAccess = await getCurrentAccountAccess();
    setAccountAccess(currentAccess);
  };

  useEffect(() => {
    loadAccountAccess();
  }, []);

  const handleRequestOtp = async () => {
    setErrorText("");
    setStatusText("");

    if (!phoneNumber.trim()) {
      setErrorText("Please enter your phone number.");
      return;
    }

    try {
      setIsRequestingOtp(true);

      const response = await requestMockOtp(phoneNumber.trim(), "login");

      setMockOtpResponse(response);
      setStatusText("Mock OTP sent successfully. Use the OTP shown below.");
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Unable to request OTP. Please try again."
      );
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorText("");
    setStatusText("");

    if (!phoneNumber.trim()) {
      setErrorText("Please enter your phone number.");
      return;
    }

    if (!otpCode.trim()) {
      setErrorText("Please enter the OTP.");
      return;
    }

    try {
      setIsVerifyingOtp(true);

      const response = await verifyMockOtp(
        phoneNumber.trim(),
        otpCode.trim(),
        "login"
      );

      const savedAccess = await saveMockLoggedInFreeAccess({
        userId: response.authAccount.userId,
        phoneNumber: response.authAccount.phoneNumber,
        displayName: response.authAccount.displayName,
      });

      setAccountAccess(savedAccess);
      setStatusText("Login successful. Account access saved locally.");
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Unable to verify OTP. Please try again."
      );
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleClearAccount = async () => {
    setErrorText("");
    setStatusText("");

    await clearCurrentAccountAccess();
    await loadAccountAccess();

    setStatusText("Local account access cleared.");
    setOtpCode("");
    setMockOtpResponse(null);
  };

  const isBusy = isRequestingOtp || isVerifyingOtp;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Account</Text>

          <View style={styles.emptyBox} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="person-circle-outline" size={36} color={ACTION_COLOR} />
          </View>

          <Text style={styles.heroTitle}>Phone Login Foundation</Text>
          <Text style={styles.heroText}>
            This is a mock OTP login foundation for development. Real SMS,
            secure token storage, and payment access will be added later.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            style={styles.input}
            placeholderTextColor="#94A3B8"
          />

          <TouchableOpacity
            style={[styles.primaryButton, isBusy && styles.disabledButton]}
            onPress={handleRequestOtp}
            activeOpacity={0.85}
            disabled={isBusy}
          >
            {isRequestingOtp ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Send Mock OTP</Text>
              </>
            )}
          </TouchableOpacity>

          {mockOtpResponse?.mockOtp && (
            <View style={styles.mockOtpBox}>
              <Text style={styles.mockOtpLabel}>Development Mock OTP</Text>
              <Text style={styles.mockOtpValue}>{mockOtpResponse.mockOtp}</Text>
              <Text style={styles.mockOtpNote}>
                This OTP is shown only for mock development. Do not show OTP in
                production.
              </Text>
            </View>
          )}

          <Text style={styles.label}>OTP code</Text>
          <TextInput
            value={otpCode}
            onChangeText={setOtpCode}
            placeholder="Enter OTP"
            keyboardType="number-pad"
            style={styles.input}
            placeholderTextColor="#94A3B8"
            maxLength={8}
          />

          <TouchableOpacity
            style={[styles.successButton, isBusy && styles.disabledButton]}
            onPress={handleVerifyOtp}
            activeOpacity={0.85}
            disabled={isBusy}
          >
            {isVerifyingOtp ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Verify OTP</Text>
              </>
            )}
          </TouchableOpacity>

          {statusText ? (
            <View style={styles.statusBox}>
              <Ionicons name="checkmark-circle-outline" size={19} color={SUCCESS_COLOR} />
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          ) : null}

          {errorText ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={19} color={ERROR_COLOR} />
              <Text style={styles.errorText}>{errorText}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.accountCard}>
          <View style={styles.accountHeaderRow}>
            <Text style={styles.accountTitle}>Current Local Access</Text>

            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearAccount}
              activeOpacity={0.85}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Logged in</Text>
            <Text style={styles.infoValue}>
              {accountAccess?.isLoggedIn ? "Yes" : "No"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={styles.infoValue}>
              {accountAccess?.userId || "Guest"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>
              {accountAccess?.phoneNumber || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>
              {accountAccess?.displayName || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Access</Text>
            <Text style={styles.infoValue}>
              {accountAccess?.accessLevel || "free"} /{" "}
              {accountAccess?.accessStatus || "active"}
            </Text>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Phase 13F Notes</Text>
          <Text style={styles.noteText}>
            This screen saves a mock logged-in free account locally. Real
            premium access will come later from backend /me/access after real
            auth is connected.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 18,
    paddingBottom: 110,
  },

  header: {
    marginTop: 8,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },

  emptyBox: {
    width: 42,
    height: 42,
  },

  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
    alignItems: "center",
  },

  heroIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  heroTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },

  heroText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    fontWeight: "700",
    textAlign: "center",
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "900",
    marginBottom: 8,
  },

  input: {
    height: 50,
    borderRadius: 15,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "800",
    marginBottom: 12,
  },

  primaryButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 14,
  },

  successButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: SUCCESS_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  disabledButton: {
    opacity: 0.65,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 7,
  },

  mockOtpBox: {
    backgroundColor: "#FFFBEB",
    borderRadius: 17,
    padding: 13,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 14,
  },

  mockOtpLabel: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "900",
    marginBottom: 4,
  },

  mockOtpValue: {
    fontSize: 24,
    color: "#92400E",
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 4,
  },

  mockOtpNote: {
    fontSize: 12,
    lineHeight: 18,
    color: "#92400E",
    fontWeight: "700",
  },

  statusBox: {
    marginTop: 12,
    backgroundColor: "#ECFDF5",
    borderRadius: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  statusText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#166534",
    fontWeight: "800",
  },

  errorBox: {
    marginTop: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#991B1B",
    fontWeight: "800",
  },

  accountCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },

  accountHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  accountTitle: {
    fontSize: 17,
    color: "#0F172A",
    fontWeight: "900",
  },

  clearButton: {
    backgroundColor: "#F1F5F9",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  clearButtonText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "900",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  infoLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "800",
  },

  infoValue: {
    flex: 1,
    textAlign: "right",
    marginLeft: 12,
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "900",
  },

  noteBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },

  noteTitle: {
    fontSize: 14,
    color: ACTION_COLOR,
    fontWeight: "900",
    marginBottom: 6,
  },

  noteText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#334155",
    fontWeight: "700",
  },
});
