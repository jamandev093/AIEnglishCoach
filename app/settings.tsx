import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  AppSettings,
  defaultSettings,
  getSettings,
  resetSettings,
  updateSettings,
} from "../src/utils/settingsStore";

import { clearActivityHistory } from "../src/utils/activityHistory";

const ACTION_COLOR = "#8499DC";

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        const savedSettings = await getSettings();
        setSettings(savedSettings);
      };

      loadSettings();
    }, [])
  );

  const updateOneSetting = async (updates: Partial<AppSettings>) => {
    const updatedSettings = await updateSettings(updates);
    setSettings(updatedSettings);
  };

  const handleShareApp = async () => {
    await Share.share({
      message:
        "Try AI English Coach — practice English speaking, grammar, pronunciation, and confidence.",
    });
  };

  const handleResetProgress = () => {
    Alert.alert(
      "Reset progress?",
      "This will clear your local activity history from this device.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await clearActivityHistory();
            Alert.alert("Progress reset", "Your local progress was cleared.");
          },
        },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      "Reset settings?",
      "This will restore all settings to default.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            const updatedSettings = await resetSettings();
            setSettings(updatedSettings);
            Alert.alert("Settings reset", "Settings restored to default.");
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Coming soon", "Logout will be connected after account system.");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Coming soon",
      "Delete account will be connected after real user account backend."
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Settings</Text>

        <View style={styles.emptyBox} />
      </View>

      {/* App Display */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardIcon}>
            <Ionicons
              name="color-palette-outline"
              size={22}
              color={ACTION_COLOR}
            />
          </View>

          <View style={styles.cardTitleBox}>
            <Text style={styles.cardTitle}>App Display</Text>
            <Text style={styles.cardSubtitle}>
              Control app language and display style.
            </Text>
          </View>
        </View>

        <View style={styles.fixedLanguageBox}>
          <View style={styles.fixedLanguageIcon}>
            <Ionicons name="language-outline" size={20} color={ACTION_COLOR} />
          </View>

          <View style={styles.fixedLanguageTextBox}>
            <Text style={styles.settingTitle}>App Language</Text>
            <Text style={styles.settingSubtitle}>
              App interface stays English for global consistency.
            </Text>
          </View>

          <View style={styles.englishPill}>
            <Text style={styles.englishPillText}>English</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingTextBox}>
            <Text style={styles.settingTitle}>Dark Mode</Text>
            <Text style={styles.settingSubtitle}>
              UI support will be completed later.
            </Text>
          </View>

          <Switch
            value={settings.darkModeEnabled}
            onValueChange={(value) =>
              updateOneSetting({ darkModeEnabled: value })
            }
            trackColor={{ false: "#CBD5E1", true: "#C7D2FE" }}
            thumbColor={settings.darkModeEnabled ? ACTION_COLOR : "#F8FAFC"}
          />
        </View>
      </View>

      {/* Practice Controls */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardIcon}>
            <Ionicons name="options-outline" size={22} color={ACTION_COLOR} />
          </View>

          <View style={styles.cardTitleBox}>
            <Text style={styles.cardTitle}>Practice Controls</Text>
            <Text style={styles.cardSubtitle}>
              These settings control app behavior globally.
            </Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingTextBox}>
            <Text style={styles.settingTitle}>Daily Reminder</Text>
            <Text style={styles.settingSubtitle}>
              Remind me to practice speaking every day.
            </Text>
          </View>

          <Switch
            value={settings.dailyReminderEnabled}
            onValueChange={(value) =>
              updateOneSetting({ dailyReminderEnabled: value })
            }
            trackColor={{ false: "#CBD5E1", true: "#C7D2FE" }}
            thumbColor={
              settings.dailyReminderEnabled ? ACTION_COLOR : "#F8FAFC"
            }
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingTextBox}>
            <Text style={styles.settingTitle}>Notifications</Text>
            <Text style={styles.settingSubtitle}>
              Allow progress and practice reminders.
            </Text>
          </View>

          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(value) =>
              updateOneSetting({ notificationsEnabled: value })
            }
            trackColor={{ false: "#CBD5E1", true: "#C7D2FE" }}
            thumbColor={
              settings.notificationsEnabled ? ACTION_COLOR : "#F8FAFC"
            }
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingTextBox}>
            <Text style={styles.settingTitle}>Mic & Bluetooth</Text>
            <Text style={styles.settingSubtitle}>
              Prepare speaking practice for mic and headset support.
            </Text>
          </View>

          <Switch
            value={settings.micBluetoothEnabled}
            onValueChange={(value) =>
              updateOneSetting({ micBluetoothEnabled: value })
            }
            trackColor={{ false: "#CBD5E1", true: "#C7D2FE" }}
            thumbColor={settings.micBluetoothEnabled ? ACTION_COLOR : "#F8FAFC"}
          />
        </View>
      </View>

      {/* App Actions */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardIcon}>
            <Ionicons name="settings-outline" size={22} color={ACTION_COLOR} />
          </View>

          <View style={styles.cardTitleBox}>
            <Text style={styles.cardTitle}>App Actions</Text>
            <Text style={styles.cardSubtitle}>
              Manage progress, sharing, and account actions.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.actionItem}
          onPress={handleResetProgress}
          activeOpacity={0.85}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="refresh-outline" size={21} color={ACTION_COLOR} />
          </View>

          <Text style={styles.actionText}>Reset Progress</Text>

          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionItem}
          onPress={handleShareApp}
          activeOpacity={0.85}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="share-social-outline" size={21} color={ACTION_COLOR} />
          </View>

          <Text style={styles.actionText}>Share App</Text>

          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionItem}
          onPress={handleResetSettings}
          activeOpacity={0.85}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="reload-outline" size={21} color={ACTION_COLOR} />
          </View>

          <Text style={styles.actionText}>Reset Settings</Text>

          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionItem}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="log-out-outline" size={21} color={ACTION_COLOR} />
          </View>

          <Text style={styles.actionText}>Logout</Text>

          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Delete Account */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeleteAccount}
        activeOpacity={0.85}
      >
        <Ionicons name="trash-outline" size={20} color="#DC2626" />
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
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
    marginBottom: 18,
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
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },

  emptyBox: {
    width: 42,
    height: 42,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  cardTitleBox: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    fontWeight: "600",
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  settingTextBox: {
    flex: 1,
    paddingRight: 14,
  },

  settingTitle: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 5,
  },

  settingSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 15,
  },

  fixedLanguageBox: {
    flexDirection: "row",
    alignItems: "center",
  },

  fixedLanguageIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  fixedLanguageTextBox: {
    flex: 1,
    paddingRight: 10,
  },

  englishPill: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  englishPillText: {
    color: ACTION_COLOR,
    fontSize: 12,
    fontWeight: "900",
  },

  actionItem: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },

  deleteButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 24,
  },

  deleteButtonText: {
    marginLeft: 8,
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "900",
  },
});