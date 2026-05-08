import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  defaultProfile,
  getProfile,
  ProfileData,
  saveProfile,
} from "../src/utils/profileStore";

import {
  AppSettings,
  defaultSettings,
  getSettings,
  updateSettings,
} from "../src/utils/settingsStore";

const ACTION_COLOR = "#8499DC";

type LearningMode = "Easy Mode" | "Teaching Mode";

type EditableProfile = ProfileData & {
  name?: string;
  email?: string;
  phone?: string;
  nativeLanguage?: string;
  learningMode?: LearningMode;
  profileImageUri?: string;
  imageUri?: string;
  advancedModeEnabled?: boolean;
};

const nativeLanguages = ["Hindi", "Bengali", "English", "Spanish", "Arabic"];

export default function ProfileScreen() {
  const [profile, setProfile] = useState<EditableProfile>(
    defaultProfile as EditableProfile
  );

  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const [editVisible, setEditVisible] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftNativeLanguage, setDraftNativeLanguage] = useState("English");

  useFocusEffect(
    useCallback(() => {
      const loadProfileAndSettings = async () => {
        const savedProfile = (await getProfile()) as EditableProfile;
        const savedSettings = await getSettings();

        setProfile(savedProfile);
        setSettings(savedSettings);

        setDraftName(savedProfile.name || "English Learner");
        setDraftEmail(savedProfile.email || "");
        setDraftPhone(savedProfile.phone || "");
        setDraftNativeLanguage(savedProfile.nativeLanguage || "English");
      };

      loadProfileAndSettings();
    }, [])
  );

  const profileImage = profile.profileImageUri || profile.imageUri || "";

  const displayName = profile.name || "English Learner";
  const displayNativeLanguage = profile.nativeLanguage || "English";
  const learningMode = profile.learningMode || "Easy Mode";
  const advancedModeEnabled = profile.advancedModeEnabled ?? true;

  const pickProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo access to select a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled) return;

    const uri = result.assets[0]?.uri;

    if (!uri) return;

    const updatedProfile: EditableProfile = {
      ...profile,
      profileImageUri: uri,
      imageUri: uri,
    };

    await saveProfile(updatedProfile as ProfileData);
    setProfile(updatedProfile);
  };

  const openEditModal = () => {
    setDraftName(profile.name || "English Learner");
    setDraftEmail(profile.email || "");
    setDraftPhone(profile.phone || "");
    setDraftNativeLanguage(profile.nativeLanguage || "English");
    setEditVisible(true);
  };

  const saveEditProfile = async () => {
    const updatedProfile: EditableProfile = {
      ...profile,
      name: draftName.trim() || "English Learner",
      email: draftEmail.trim(),
      phone: draftPhone.trim(),
      nativeLanguage: draftNativeLanguage,
    };

    await saveProfile(updatedProfile as ProfileData);
    setProfile(updatedProfile);
    setEditVisible(false);
  };

  const changeLearningMode = async (mode: LearningMode) => {
    const updatedProfile: EditableProfile = {
      ...profile,
      learningMode: mode,
    };

    await saveProfile(updatedProfile as ProfileData);
    setProfile(updatedProfile);
  };

  const toggleAdvancedMode = async (value: boolean) => {
    const updatedProfile: EditableProfile = {
      ...profile,
      advancedModeEnabled: value,
    };

    await saveProfile(updatedProfile as ProfileData);
    setProfile(updatedProfile);
  };

  const updateOneSetting = async (updates: Partial<AppSettings>) => {
    const updatedSettings = await updateSettings(updates);
    setSettings(updatedSettings);
  };

  const toggleEnglishOnlyMode = async (value: boolean) => {
    const updatedSettings = await updateSettings({
      englishOnlyMode: value,
    });

    setSettings(updatedSettings);
  };

  const goToSettings = () => {
    router.push("/settings");
  };

  return (
    <>
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

          <Text style={styles.headerTitle}>Profile</Text>

          <TouchableOpacity style={styles.headerIconButton} onPress={goToSettings}>
            <Ionicons name="settings-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Profile Top Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={pickProfileImage}
            activeOpacity={0.85}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={34} color={ACTION_COLOR} />
              </View>
            )}

            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.profileNameBox}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileSubtitle}>
              {displayNativeLanguage} learner
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={openEditModal}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={18} color={ACTION_COLOR} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        <View style={styles.personalInfoCard}>
          <View style={styles.personalInfoHeader}>
            <View style={styles.personalInfoIcon}>
              <Ionicons
                name="person-circle-outline"
                size={25}
                color={ACTION_COLOR}
              />
            </View>

            <Text style={styles.personalInfoTitle}>Personal Information</Text>
          </View>

          <View style={styles.infoLine}>
            <View style={styles.infoLineIcon}>
              <Ionicons name="person-outline" size={18} color={ACTION_COLOR} />
            </View>

            <View style={styles.infoLineTextBox}>
              <Text style={styles.infoLineLabel}>Name</Text>
              <Text style={styles.infoLineValue}>{displayName}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoLine}>
            <View style={styles.infoLineIcon}>
              <Ionicons name="mail-outline" size={18} color={ACTION_COLOR} />
            </View>

            <View style={styles.infoLineTextBox}>
              <Text style={styles.infoLineLabel}>Email</Text>
              <Text style={styles.infoLineValue}>
                {profile.email?.trim() ? profile.email : "Not added"}
              </Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoLine}>
            <View style={styles.infoLineIcon}>
              <Ionicons name="call-outline" size={18} color={ACTION_COLOR} />
            </View>

            <View style={styles.infoLineTextBox}>
              <Text style={styles.infoLineLabel}>Phone</Text>
              <Text style={styles.infoLineValue}>
                {profile.phone?.trim() ? profile.phone : "Not added"}
              </Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoLine}>
            <View style={styles.infoLineIcon}>
              <Ionicons name="language-outline" size={18} color={ACTION_COLOR} />
            </View>

            <View style={styles.infoLineTextBox}>
              <Text style={styles.infoLineLabel}>Native Language</Text>
              <Text style={styles.infoLineValue}>{displayNativeLanguage}</Text>
            </View>
          </View>
        </View>

        {/* System Level */}
        <View style={styles.levelCard}>
          <View style={styles.levelTopRow}>
            <View style={styles.levelIcon}>
              <Ionicons
                name="trending-up-outline"
                size={24}
                color={ACTION_COLOR}
              />
            </View>

            <View style={styles.levelTextBox}>
              <Text style={styles.levelTitle}>Beginner Speaker</Text>
              <Text style={styles.levelSubtitle}>
                System-calculated level based on your activity history.
              </Text>
            </View>

            <View style={styles.levelPercentPill}>
              <Text style={styles.levelPercentText}>32%</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <View style={styles.lockedRow}>
            <Ionicons name="lock-closed-outline" size={16} color={ACTION_COLOR} />
            <Text style={styles.lockedText}>
              Locked: users cannot manually change this level.
            </Text>
          </View>
        </View>

        {/* English Only Sync */}
        <View style={styles.settingsSyncCard}>
          <View style={styles.settingsSyncTopRow}>
            <View style={styles.settingsSyncIcon}>
              <Ionicons name="language-outline" size={22} color={ACTION_COLOR} />
            </View>

            <View style={styles.settingsSyncTextBox}>
              <Text style={styles.settingsSyncTitle}>
                English-Only Practice Mode
              </Text>
              <Text style={styles.settingsSyncSubtitle}>
                {settings.englishOnlyMode
                  ? "Active: the app shows English-only support everywhere."
                  : "Off: meanings and explanations can use your native language."}
              </Text>
            </View>

            <Switch
              value={settings.englishOnlyMode}
              onValueChange={toggleEnglishOnlyMode}
              trackColor={{ false: "#CBD5E1", true: "#C7D2FE" }}
              thumbColor={settings.englishOnlyMode ? ACTION_COLOR : "#F8FAFC"}
            />
          </View>

          <View style={styles.settingsSyncNotice}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={ACTION_COLOR}
            />
            <Text style={styles.settingsSyncNoticeText}>
              Shared with Settings. When ON, native-language help is hidden
              across learning screens.
            </Text>
          </View>
        </View>

        {/* Voice & Appearance */}
        <View style={styles.voiceAppearanceCard}>
          <View style={styles.voiceAppearanceHeader}>
            <View style={styles.voiceAppearanceIcon}>
              <Ionicons
                name="color-palette-outline"
                size={22}
                color={ACTION_COLOR}
              />
            </View>

            <View style={styles.voiceAppearanceTextBox}>
              <Text style={styles.voiceAppearanceTitle}>Voice & Appearance</Text>
              <Text style={styles.voiceAppearanceSubtitle}>
                Choose your coach voice style.
              </Text>
            </View>
          </View>

          <View style={styles.voiceBox}>
            <Text style={styles.voiceLabel}>Coach Voice</Text>

            <View style={styles.voiceOptions}>
              {(["Default", "Female", "Male"] as const).map((voice) => {
                const active = settings.coachVoice === voice;

                return (
                  <TouchableOpacity
                    key={voice}
                    style={[styles.voicePill, active && styles.voicePillActive]}
                    onPress={() => updateOneSetting({ coachVoice: voice })}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={
                        voice === "Default"
                          ? "sparkles-outline"
                          : voice === "Female"
                          ? "woman-outline"
                          : "man-outline"
                      }
                      size={17}
                      color={active ? ACTION_COLOR : "#94A3B8"}
                    />

                    <Text
                      style={[
                        styles.voicePillText,
                        active && styles.voicePillTextActive,
                      ]}
                    >
                      {voice}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Coach Mode */}
        <Text style={styles.sectionTitle}>Coach Mode</Text>

        <View style={styles.coachCard}>
          <Text style={styles.coachDescription}>
            Choose how your AI coach explains corrections.
          </Text>

          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                learningMode === "Easy Mode" && styles.modeButtonActiveLight,
              ]}
              onPress={() => changeLearningMode("Easy Mode")}
              activeOpacity={0.85}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={22}
                color={learningMode === "Easy Mode" ? ACTION_COLOR : "#94A3B8"}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  learningMode === "Easy Mode" && styles.modeButtonTextActive,
                ]}
              >
                Easy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                learningMode === "Teaching Mode" && styles.modeButtonActiveDark,
              ]}
              onPress={() => changeLearningMode("Teaching Mode")}
              activeOpacity={0.85}
            >
              <Ionicons
                name="cube-outline"
                size={22}
                color={learningMode === "Teaching Mode" ? "#FFFFFF" : "#94A3B8"}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  learningMode === "Teaching Mode" &&
                    styles.modeButtonTextActiveDark,
                ]}
              >
                Teaching
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.advancedBox}>
            <View style={styles.advancedIcon}>
              <Ionicons name="sparkles-outline" size={25} color="#6D5DF6" />
            </View>

            <View style={styles.advancedTextBox}>
              <Text style={styles.advancedTitle}>Advanced Mode</Text>
              <Text style={styles.advancedSubtitle}>
                Deeper grammar, examples, and detailed correction flow.
              </Text>
            </View>

            <Switch
              value={advancedModeEnabled}
              onValueChange={toggleAdvancedMode}
              trackColor={{ false: "#CBD5E1", true: "#C7D2FE" }}
              thumbColor={advancedModeEnabled ? "#6D5DF6" : "#F8FAFC"}
            />
          </View>
        </View>

        {/* Subscription Card */}
        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionTopRow}>
            <View style={styles.crownCircle}>
              <Ionicons name="ribbon-outline" size={32} color="#F6A800" />
            </View>

            <View style={styles.subscriptionTitleBox}>
              <Text style={styles.subscriptionTitle}>Free Plan</Text>
              <Text style={styles.subscriptionSubtitle}>
                Start with daily speaking practice and basic AI correction.
              </Text>
            </View>
          </View>

          <View style={styles.planFeatureRow}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.planFeatureText}>Daily speaking missions</Text>
          </View>

          <View style={styles.planFeatureRow}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.planFeatureText}>
              Grammar and meaning support
            </Text>
          </View>

          <View style={styles.planFeatureRow}>
            <Ionicons name="lock-closed" size={22} color="#F59E0B" />
            <Text style={styles.planFeatureText}>
              Pro mistake memory and advanced reports later
            </Text>
          </View>

          <TouchableOpacity
            style={styles.upgradeButton}
            activeOpacity={0.85}
            onPress={() =>
              Alert.alert("Coming soon", "Subscription plans will be added later.")
            }
          >
            <Text style={styles.upgradeButtonText}>Upgrade Later</Text>
            <Ionicons name="arrow-forward" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity
          style={styles.accountCard}
          onPress={goToSettings}
          activeOpacity={0.85}
        >
          <View style={styles.accountIcon}>
            <Ionicons name="settings-outline" size={28} color="#6D5DF6" />
          </View>

          <View style={styles.accountTextBox}>
            <Text style={styles.accountTitle}>Settings</Text>
            <Text style={styles.accountSubtitle}>
              App language, reminders, display, and account options
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setEditVisible(false)}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Your name"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Gmail / Email</Text>
            <TextInput
              style={styles.input}
              value={draftEmail}
              onChangeText={setDraftEmail}
              placeholder="example@gmail.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={draftPhone}
              onChangeText={setDraftPhone}
              placeholder="Phone number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Native Language</Text>
            <View style={styles.languageWrap}>
              {nativeLanguages.map((language) => {
                const active = draftNativeLanguage === language;

                return (
                  <TouchableOpacity
                    key={language}
                    style={[
                      styles.languageChip,
                      active && styles.languageChipActive,
                    ]}
                    onPress={() => setDraftNativeLanguage(language)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.languageChipText,
                        active && styles.languageChipTextActive,
                      ]}
                    >
                      {language}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveEditProfile}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  avatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    marginRight: 14,
  },

  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },

  avatarPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  profileNameBox: {
    flex: 1,
  },

  profileName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },

  profileSubtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
  },

  editButton: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  editButtonText: {
    marginLeft: 5,
    color: ACTION_COLOR,
    fontSize: 13,
    fontWeight: "900",
  },

  personalInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },

  personalInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  personalInfoIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  personalInfoTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },

  infoLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
  },

  infoLineIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  infoLineTextBox: {
    flex: 1,
  },

  infoLineLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "900",
    marginBottom: 4,
  },

  infoLineValue: {
    fontSize: 15,
    lineHeight: 21,
    color: "#0F172A",
    fontWeight: "900",
  },

  infoDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },

  levelCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },

  levelTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  levelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  levelTextBox: {
    flex: 1,
    paddingRight: 10,
  },

  levelTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },

  levelSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  levelPercentPill: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  levelPercentText: {
    color: ACTION_COLOR,
    fontSize: 13,
    fontWeight: "900",
  },

  progressTrack: {
    marginTop: 14,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },

  progressFill: {
    width: "32%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: ACTION_COLOR,
  },

  lockedRow: {
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  lockedText: {
    marginLeft: 6,
    flex: 1,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },

  settingsSyncCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },

  settingsSyncTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  settingsSyncIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  settingsSyncTextBox: {
    flex: 1,
    paddingRight: 10,
  },

  settingsSyncTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },

  settingsSyncSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  settingsSyncNotice: {
    marginTop: 12,
    backgroundColor: "#EEF2FF",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  settingsSyncNoticeText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 18,
    color: "#334155",
    fontWeight: "700",
  },

  voiceAppearanceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  voiceAppearanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  voiceAppearanceIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  voiceAppearanceTextBox: {
    flex: 1,
  },

  voiceAppearanceTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },

  voiceAppearanceSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  voiceBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  voiceLabel: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 10,
  },

  voiceOptions: {
    flexDirection: "row",
    gap: 8,
  },

  voicePill: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  voicePillActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  voicePillText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: "900",
    color: "#64748B",
  },

  voicePillTextActive: {
    color: ACTION_COLOR,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 14,
  },

  coachCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 22,
  },

  coachDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    fontWeight: "800",
    marginBottom: 16,
  },

  modeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },

  modeButton: {
    flex: 1,
    height: 62,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  modeButtonActiveLight: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  modeButtonActiveDark: {
    backgroundColor: ACTION_COLOR,
    borderColor: ACTION_COLOR,
  },

  modeButtonText: {
    marginLeft: 8,
    fontSize: 15,
    color: "#94A3B8",
    fontWeight: "900",
  },

  modeButtonTextActive: {
    color: ACTION_COLOR,
  },

  modeButtonTextActiveDark: {
    color: "#FFFFFF",
  },

  advancedBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  advancedIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  advancedTextBox: {
    flex: 1,
    paddingRight: 10,
  },

  advancedTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 5,
  },

  advancedSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    fontWeight: "700",
  },

  subscriptionCard: {
    backgroundColor: "#F4E7E7",
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#EEDADA",
  },

  subscriptionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  crownCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF3B0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  subscriptionTitleBox: {
    flex: 1,
  },

  subscriptionTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 7,
  },

  subscriptionSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "#64748B",
    fontWeight: "800",
  },

  planFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  planFeatureText: {
    flex: 1,
    marginLeft: 11,
    fontSize: 15,
    lineHeight: 21,
    color: "#334155",
    fontWeight: "900",
  },

  upgradeButton: {
    marginTop: 18,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  upgradeButtonText: {
    fontSize: 17,
    color: "#0F172A",
    fontWeight: "900",
    marginRight: 10,
  },

  accountCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },

  accountIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  accountTextBox: {
    flex: 1,
    paddingRight: 10,
  },

  accountTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 5,
  },

  accountSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: 18,
  },

  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },

  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  inputLabel: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "900",
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    height: 48,
    borderRadius: 15,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 14,
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },

  languageWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },

  languageChip: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  languageChipActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  languageChipText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "900",
  },

  languageChipTextActive: {
    color: ACTION_COLOR,
  },

  saveButton: {
    marginTop: 18,
    height: 50,
    borderRadius: 16,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  saveButtonText: {
    marginLeft: 7,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});