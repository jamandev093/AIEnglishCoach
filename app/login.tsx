import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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

import { requestMockOtp } from "../src/utils/authApi";

const ACTION_COLOR = "#8499DC";
const ERROR_COLOR = "#DC2626";

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleSendOtp = async () => {
    setErrorText("");

    if (!phoneNumber.trim()) {
      setErrorText("Please enter your phone number.");
      return;
    }

    try {
      setIsSendingOtp(true);

      const response = await requestMockOtp(phoneNumber.trim(), "login");

      router.push({
        pathname: "/otpVerify",
        params: {
          phoneNumber: response.phoneNumber,
          mockOtp: response.mockOtp ?? "",
        },
      } as any);
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Unable to send OTP. Please try again."
      );
    } finally {
      setIsSendingOtp(false);
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

          <Text style={styles.headerTitle}>Login</Text>

          <View style={styles.emptyBox} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="call-outline" size={34} color={ACTION_COLOR} />
          </View>

          <Text style={styles.heroTitle}>Login / Create Account</Text>
          <Text style={styles.heroText}>
            Use your phone number to continue. This is a mock OTP foundation for
            development. Real SMS will be added later.
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
            style={[styles.primaryButton, isSendingOtp && styles.disabledButton]}
            onPress={handleSendOtp}
            activeOpacity={0.85}
            disabled={isSendingOtp}
          >
            {isSendingOtp ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.primaryButtonText}>Send OTP</Text>
              </>
            )}
          </TouchableOpacity>

          {errorText ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={19} color={ERROR_COLOR} />
              <Text style={styles.errorText}>{errorText}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Development Note</Text>
          <Text style={styles.noteText}>
            For now, OTP is mock-only. Use sample phone number 9876543210 and
            mock OTP 123456 after the OTP verification screen is added.
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
