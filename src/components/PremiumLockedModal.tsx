import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ACTION_COLOR = "#8499dc";

type PremiumLockedModalProps = {
  visible: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
};

export default function PremiumLockedModal({
  visible,
  title = "Premium Practice",
  message = "This lesson is part of Premium. Payment and account access will be added soon. For now, continue with free practice.",
  onClose,
}: PremiumLockedModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed-outline" size={30} color={ACTION_COLOR} />
          </View>

          <Text style={styles.title}>{title}</Text>

          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Continue Free Practice</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },

  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 22,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 21,
    color: "#0F172A",
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },

  message: {
    fontSize: 14,
    lineHeight: 22,
    color: "#475569",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },

  primaryButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  primaryButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "900",
  },

  secondaryButton: {
    width: "100%",
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  secondaryButtonText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "900",
  },
});
