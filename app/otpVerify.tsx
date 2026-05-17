import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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

import { verifyMockOtp } from "../src/utils/authApi";
import { saveMockLoggedInFreeAccess } from "../src/utils/accountAccessStore";

const ACTION_COLOR = "#8499DC";
const ERROR_COLOR = "#DC2626";
const SUCCESS_COLOR = "#16A34A";

export default function OtpVerifyScreen() {
  const params = useLocalSearchParams<{
    phoneNumber?: string;
    mockOtp?: string;
  }>();

  const phoneNumber = Array.isArray(params.phoneNumber)
    ? params.phoneNumber[0]
    : params.phoneNumber || "";

  const mockOtp = Array.isArray(params.mockOtp)
    ? params.mockOtp[0]
    : params.mockOtp || "";

  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState("");

  const handleVerifyOtp = async () => {
    setStatusText("");
    setErrorText("");

    if (!phoneNumber.trim()) {
      setErrorText("Phone number is missing. Please go back and request OTP again.");
      return;
    }

    if (!otpCode.trim()) {
      setErrorText("Please enter the OTP.");
      return;
    }

    try {
      setIsVerifying(true);

      const response = await verifyMockOtp(
        phoneNumber.trim(),
        otpCode.trim(),
        "login"
      );

      await saveMockLoggedInFreeAccess({
        userId: response.authAccount.userId,
        phoneNumber: response.authAccount.phoneNumber,
        displayName: response.authAccount.displayName,
      });

      setStatusText("OTP verified. Account access saved locally.");

      setTimeout(() => {
        router.replace("/account" as any);
      }, 500);
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Unable to verify OTP. Please try again."
      );
    } finally {
      setIsVerifying(false);
    }
  };

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

          <Text style={styles.headerTitle}>Verify OTP</Text>

          <View style={styles.emptyBox} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="shield-checkmark-outline" size={34} color={ACTION_COLOR} />
          </View>

          <Text style={styles.heroTitle}>Enter Verification Code</Text>
          <Text style={styles.heroText}>
            Enter the OTP for your phone number to continue. This is mock OTP
            verification for development.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Phone number</Text>

          <View style={styles.phoneBox}>
            <Ionicons name="call-outline" size={18} color={ACTION_COLOR} />
            <Text style={styles.phoneText}>
              {phoneNumber || "Phone number missing"}
            </Text>
          </View>

          {mockOtp ? (
            <View style={styles.mockOtpBox}>
              <Text style={styles.mockOtpLabel}>Development OTP</Text>
              <Text style={styles.mockOtpValue}>{mockOtp}</Text>
              <Text style={styles.mockOtpNote}>
                This OTP is shown only for mock development. Do not show OTP in
                production.
              </Text>
            </View>
          ) : null}

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
            style={[styles.primaryButton, isVerifying && styles.disabledButton]}
            onPress={handleVerifyOtp}
            activeOpacity={0.85}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Verify OTP</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
            activeOpacity={0.85}
            disabled={isVerifying}
          >
            <Ionicons name="arrow-back-outline" size={18} color={ACTION_COLOR} />
            <Text style={styles.secondaryButtonText}>Back to Login</Text>
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

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Test Account</Text>
          <Text style={styles.noteText}>
            Use phone number 9876543210 and OTP 123456 for the first mock
            login test. Unknown phone numbers are not auto-created yet.
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
    paddingBottom: 80,
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
    width: 64,
    height: 64,
    borderRadius: 32,
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

  phoneBox: {
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingHorizontal: 14,
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 12,
  },

  phoneText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
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
    fontSize: 25,
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
    marginBottom: 10,
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

  secondaryButton: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  secondaryButtonText: {
    color: ACTION_COLOR,
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 7,
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
