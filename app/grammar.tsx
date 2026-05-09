import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { addActivity } from "../src/utils/activityHistory";

import {
  defaultProfile,
  getProfile,
  ProfileData,
} from "../src/utils/profileStore";

import {
  AppSettings,
  defaultSettings,
  getSettings,
} from "../src/utils/settingsStore";

import {
  getDisplayLanguage,
  getLanguageModeLabel,
} from "../src/utils/languageMode";

import { analyzeSentenceWithBackend } from "../src/config/api";

type CoachMode = "Easy Mode" | "Teaching Mode";
type RepeatState = "idle" | "recording" | "done";

type GrammarResult = {
  input: string;
  corrected: string;
  score: number;
  mistakes: string[];
  easyExplanation: {
    english: string;
    hindi: string;
    bengali: string;
  };
  teacherExplanation: {
    english: string;
    hindi: string;
    bengali: string;
  };
  pattern: string;
  repeatTask: string;
};

const ACTION_COLOR = "#8499DC";

const demoResults: GrammarResult[] = [
  {
    input: "I go market",
    corrected: "I went to the market.",
    score: 62,
    mistakes: ["Past tense", "Missing “to”", "Missing “the”"],
    easyExplanation: {
      english:
        "You are talking about a past action, so use “went”. We also say “go to a place”.",
      hindi:
        "आप बीते समय की बात कर रहे हैं, इसलिए “went” सही है। जगह के लिए “to” भी चाहिए।",
      bengali:
        "আপনি অতীতের কথা বলছেন, তাই “went” হবে। কোনো জায়গায় যাওয়ার আগে “to” লাগে।",
    },
    teacherExplanation: {
      english:
        "Use past tense because the action already happened. “Go” becomes “went”. Use “to” before a place, and “the” before a specific market.",
      hindi:
        "Action past में हुआ है, इसलिए past tense चाहिए। “Go” का past form “went” है। Place से पहले “to” और specific place से पहले “the” लगाना सही है।",
      bengali:
        "কাজটি অতীতে হয়েছে, তাই past tense দরকার। “Go” এর past form “went”। জায়গার আগে “to” এবং নির্দিষ্ট জায়গার আগে “the” ব্যবহার করা হয়।",
    },
    pattern: "I went to + place",
    repeatTask: "Repeat the corrected sentence until it feels natural.",
  },
  {
    input: "She go school",
    corrected: "She goes to school.",
    score: 68,
    mistakes: ["Verb form", "Missing “to”"],
    easyExplanation: {
      english: "With “she”, use “goes”. We also say “goes to school”.",
      hindi:
        "“She” के साथ “goes” आता है। और सही वाक्य है “goes to school”.",
      bengali:
        "“She” এর সাথে “goes” ব্যবহার হয়। সঠিক বাক্য: “goes to school”.",
    },
    teacherExplanation: {
      english:
        "In simple present tense, third-person singular subjects like he, she, and it take an -s or -es verb form. So “go” becomes “goes”.",
      hindi:
        "Simple present tense में he/she/it के साथ verb में -s या -es जुड़ता है। इसलिए “go” → “goes”.",
      bengali:
        "Simple present tense-এ he/she/it এর সাথে verb-এ -s বা -es যোগ হয়। তাই “go” → “goes”.",
    },
    pattern: "She goes to + place",
    repeatTask: "Repeat the corrected sentence and notice “goes to”.",
  },
  {
    input: "I am agree",
    corrected: "I agree.",
    score: 72,
    mistakes: ["Unnecessary “am”"],
    easyExplanation: {
      english: "Do not use “am” with “agree”. Say “I agree”.",
      hindi: "“Agree” के साथ “am” मत लगाइए। सही है “I agree”.",
      bengali: "“Agree” এর সাথে “am” লাগবে না। সঠিক: “I agree”.",
    },
    teacherExplanation: {
      english:
        "“Agree” is a main verb, not an adjective. So it does not need “am”. The correct structure is subject + agree.",
      hindi:
        "“Agree” main verb है, adjective नहीं। इसलिए इसके साथ “am” की जरूरत नहीं है।",
      bengali:
        "“Agree” একটি main verb, adjective নয়। তাই এর সাথে “am” দরকার নেই।",
    },
    pattern: "Subject + agree",
    repeatTask: "Repeat the corrected sentence and avoid adding “am”.",
  },
];

const futureItems = [
  "Real backend grammar analysis",
  "Correction while speaking",
  "Mistake memory from repeated errors",
  "English-Only Practice Mode support",
  "Personal grammar drills from your history",
];

export default function GrammarCoachScreen() {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const [userSentence, setUserSentence] = useState("I go market");
  const [result, setResult] = useState<GrammarResult>(demoResults[0]);
  const [selectedMode, setSelectedMode] = useState<CoachMode>("Easy Mode");
  const [repeatState, setRepeatState] = useState<RepeatState>("idle");
  const [showResultModal, setShowResultModal] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barOne = useRef(new Animated.Value(12)).current;
  const barTwo = useRef(new Animated.Value(24)).current;
  const barThree = useRef(new Animated.Value(16)).current;
  const barFour = useRef(new Animated.Value(28)).current;

  useFocusEffect(
    useCallback(() => {
      const loadProfileAndSettings = async () => {
        const savedProfile = await getProfile();
        const savedSettings = await getSettings();

        setProfile(savedProfile);
        setSettings(savedSettings);
        setSelectedMode(savedProfile.learningMode || "Easy Mode");
      };

      loadProfileAndSettings();
    }, [])
  );

  useEffect(() => {
    if (repeatState !== "recording") {
      pulseAnim.setValue(1);
      barOne.setValue(12);
      barTwo.setValue(24);
      barThree.setValue(16);
      barFour.setValue(28);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.07,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
      ])
    );

    const barsLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(barOne, {
            toValue: 30,
            duration: 420,
            useNativeDriver: false,
          }),
          Animated.timing(barOne, {
            toValue: 12,
            duration: 420,
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.timing(barTwo, {
            toValue: 14,
            duration: 470,
            useNativeDriver: false,
          }),
          Animated.timing(barTwo, {
            toValue: 28,
            duration: 470,
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.timing(barThree, {
            toValue: 34,
            duration: 390,
            useNativeDriver: false,
          }),
          Animated.timing(barThree, {
            toValue: 16,
            duration: 390,
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.timing(barFour, {
            toValue: 12,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(barFour, {
            toValue: 30,
            duration: 500,
            useNativeDriver: false,
          }),
        ]),
      ])
    );

    pulseLoop.start();
    barsLoop.start();

    return () => {
      pulseLoop.stop();
      barsLoop.stop();
    };
  }, [repeatState, pulseAnim, barOne, barTwo, barThree, barFour]);

  const displayLanguage = getDisplayLanguage(profile, settings);
  const languageModeLabel = getLanguageModeLabel(profile, settings);

  const speakText = (text: string) => {
    if (!text.trim()) return;

    Speech.stop();
    Speech.speak(text, {
      language: "en-US",
      rate: 0.82,
    });
  };

  const getExplanationText = () => {
    const explanation =
      selectedMode === "Teaching Mode"
        ? result.teacherExplanation
        : result.easyExplanation;

    if (displayLanguage === "Bengali") return explanation.bengali;
    if (displayLanguage === "Hindi") return explanation.hindi;

    return explanation.english;
  };

 const analyzeSentence = async () => {
  const cleanSentence = userSentence.trim();

  if (!cleanSentence) {
    return;
  }

  try {
    const backendResult = await analyzeSentenceWithBackend(cleanSentence);

    const mappedResult: GrammarResult = {
      input: backendResult.originalText || cleanSentence,
      corrected:
        backendResult.correctedText ||
        backendResult.improved ||
        cleanSentence,
      score: backendResult.score || 0,
      mistakes:
        backendResult.mistakes && backendResult.mistakes.length > 0
          ? backendResult.mistakes
          : ["No major mistake found"],
      easyExplanation: {
        english:
          backendResult.simpleExplanation ||
          "Your sentence is understandable.",
        hindi:
          backendResult.simpleExplanation ||
          "आपका वाक्य समझ में आता है।",
        bengali:
          backendResult.simpleExplanation ||
          "আপনার বাক্যটি বোঝা যাচ্ছে।",
      },
      teacherExplanation: {
        english:
          backendResult.teacherExplanation ||
          backendResult.simpleExplanation ||
          "The backend checked your sentence.",
        hindi:
          backendResult.teacherExplanation ||
          backendResult.simpleExplanation ||
          "Backend ने आपका sentence check किया।",
        bengali:
          backendResult.teacherExplanation ||
          backendResult.simpleExplanation ||
          "Backend আপনার sentence check করেছে।",
      },
      pattern:
        backendResult.repeatSentence ||
        backendResult.correctedText ||
        "Repeat the corrected sentence.",
      repeatTask:
        backendResult.smartSuggestion ||
        backendResult.coachReply ||
        "Repeat the corrected sentence slowly and clearly.",
    };

    setResult(mappedResult);
    setRepeatState("idle");
    setShowResultModal(true);

    await addActivity({
      type: "grammar",
      title: "Grammar correction",
      detail: `Fixed: ${mappedResult.input} → ${mappedResult.corrected}`,
      score: mappedResult.score,
      mistake: mappedResult.mistakes.join(", "),
      correctedSentence: mappedResult.corrected,
    });
  } catch (error) {
    console.log("Grammar backend error:", error);

    const fallback =
      demoResults.find(
        (item) => item.input.toLowerCase() === cleanSentence.toLowerCase()
      ) || demoResults[0];

    setResult(fallback);
    setRepeatState("idle");
    setShowResultModal(true);
  }
};

  const chooseDemo = (item: GrammarResult) => {
    setUserSentence(item.input);
    setResult(item);
    setRepeatState("idle");
    setShowResultModal(false);
  };

  const handleRepeatPractice = async () => {
    if (repeatState === "idle") {
      setRepeatState("recording");
      return;
    }

    if (repeatState === "recording") {
      setRepeatState("done");

      await addActivity({
        type: "grammar",
        title: "Grammar repeat practice",
        detail: `Repeated corrected sentence: ${result.corrected}`,
        score: Math.min(result.score + 8, 100),
        mistake: result.mistakes.join(", "),
        correctedSentence: result.corrected,
      });

      return;
    }

    setRepeatState("idle");
  };

  const startRepeatFromModal = () => {
    setShowResultModal(false);
    setRepeatState("recording");
  };

  const openResultAgain = () => {
    setShowResultModal(true);
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Grammar Coach</Text>

          <View style={styles.emptyBox} />
        </View>


        {/* Write Your Sentence */}
        <View style={styles.inputCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardIcon}>
              <Ionicons name="create-outline" size={22} color={ACTION_COLOR} />
            </View>

            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Write Your Sentence</Text>
              <Text style={styles.cardSubtitle}>
                Type a sentence you would normally say.
              </Text>
            </View>
          </View>

          <TextInput
            style={styles.input}
            value={userSentence}
            onChangeText={setUserSentence}
            placeholder="Example: I go market"
            placeholderTextColor="#94A3B8"
            multiline
          />

          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={analyzeSentence}
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
            <Text style={styles.analyzeButtonText}>Analyze Grammar</Text>
          </TouchableOpacity>
        </View>

        {/* Suggestions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Common Mistake Suggestions</Text>
          <Text style={styles.sectionSubtitle}>
            Tap a common sentence to test the correction flow.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.demoRow}
        >
          {demoResults.map((item) => {
            const active = result.input === item.input;

            return (
              <TouchableOpacity
                key={item.input}
                style={[styles.demoCard, active && styles.demoCardActive]}
                onPress={() => chooseDemo(item)}
                activeOpacity={0.85}
              >
                <View style={styles.demoWrongBox}>
                  <Text
                    numberOfLines={1}
                    style={[styles.demoWrong, active && styles.demoWrongActive]}
                  >
                    {item.input}
                  </Text>
                </View>

                <Text numberOfLines={1} style={styles.demoCorrect}>
                  → {item.corrected}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Compact Repeat Practice */}
        <View style={styles.repeatCard}>
          <View style={styles.repeatTopRow}>
            <View style={styles.repeatIcon}>
              <Ionicons name="repeat-outline" size={22} color={ACTION_COLOR} />
            </View>

            <View style={styles.repeatTitleBox}>
              <Text style={styles.repeatTitle}>Repeat Correct Sentence</Text>
              <Text style={styles.repeatSubtitle}>
                Repeat after the popup explanation.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.listenMiniButton}
              onPress={() => speakText(result.corrected)}
              activeOpacity={0.85}
            >
              <Ionicons name="volume-high" size={19} color={ACTION_COLOR} />
            </TouchableOpacity>
          </View>

          <View style={styles.repeatSentenceBox}>
            <Text style={styles.repeatSentence}>{result.corrected}</Text>
          </View>

          <View
            style={[
              styles.repeatRecordingBox,
              repeatState === "recording" && styles.repeatRecordingBoxActive,
            ]}
          >
            <Animated.View
              style={[
                styles.repeatMicCircle,
                repeatState === "recording" && {
                  backgroundColor: "#DC2626",
                  borderColor: "#DC2626",
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Ionicons
                name={repeatState === "recording" ? "radio-button-on" : "mic-outline"}
                size={24}
                color={repeatState === "recording" ? "#FFFFFF" : ACTION_COLOR}
              />
            </Animated.View>

            <View style={styles.repeatWaveBox}>
              <Animated.View style={[styles.repeatWaveBar, { height: barOne }]} />
              <Animated.View style={[styles.repeatWaveBar, { height: barTwo }]} />
              <Animated.View style={[styles.repeatWaveBar, { height: barThree }]} />
              <Animated.View style={[styles.repeatWaveBar, { height: barFour }]} />
            </View>

            <View style={styles.repeatStatusBox}>
              <Text style={styles.repeatStatusTitle}>
                {repeatState === "idle"
                  ? "Ready"
                  : repeatState === "recording"
                  ? "Recording..."
                  : "Saved"}
              </Text>

              <Text style={styles.repeatStatusText}>
                {repeatState === "idle"
                  ? "Open result first, then repeat."
                  : repeatState === "recording"
                  ? "Say the corrected sentence clearly."
                  : "Repeat saved to Progress."}
              </Text>
            </View>
          </View>

          {repeatState === "done" && (
            <View style={styles.repeatSavedBox}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <Text style={styles.repeatSavedText}>
                Grammar repeat activity saved to Progress.
              </Text>
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.lightButton}
              onPress={openResultAgain}
              activeOpacity={0.85}
            >
              <Ionicons name="expand-outline" size={18} color={ACTION_COLOR} />
              <Text style={styles.lightButtonText}>Open Result</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                repeatState === "recording" && styles.primaryButtonRecording,
              ]}
              onPress={handleRepeatPractice}
              activeOpacity={0.85}
            >
              <Ionicons
                name={
                  repeatState === "idle"
                    ? "mic-outline"
                    : repeatState === "recording"
                    ? "stop"
                    : "refresh-outline"
                }
                size={18}
                color="#FFFFFF"
              />

              <Text style={styles.primaryButtonText}>
                {repeatState === "idle"
                  ? "Start Repeat"
                  : repeatState === "recording"
                  ? "Stop & Save"
                  : "Try Again"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Compact Coming Soon */}
        <View style={styles.futureCard}>
          <View style={styles.futureHeaderRow}>
            <View style={styles.futureIcon}>
              <Ionicons name="sparkles-outline" size={21} color={ACTION_COLOR} />
            </View>

            <View style={styles.futureTitleBox}>
              <Text style={styles.futureTitle}>Coming Soon</Text>
              <Text style={styles.futureSubtitle}>
                Real speaking grammar correction will connect after backend.
              </Text>
            </View>
          </View>

          <View style={styles.futureList}>
            {futureItems.map((item) => (
              <View key={item} style={styles.futureItemRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={17}
                  color={ACTION_COLOR}
                />
                <Text style={styles.futureItemText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Analysis Result Popup */}
      <Modal
        visible={showResultModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons
                  name="sparkles-outline"
                  size={23}
                  color={ACTION_COLOR}
                />
              </View>

              <View style={styles.modalTitleBox}>
                <Text style={styles.modalLabel}>Grammar Result</Text>
                <Text style={styles.modalTitle}>Your sentence is improved</Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowResultModal(false)}
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={21} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Score */}
              <View style={styles.modalScoreRow}>
                <View>
                  <Text style={styles.modalScoreLabel}>Grammar score</Text>
                  <Text style={styles.modalScoreSubLabel}>
                    Based on current rule-based MVP check
                  </Text>
                </View>

                <Text style={styles.modalScoreValue}>{result.score}%</Text>
              </View>

              {/* Before / After */}
              <View style={styles.modalBeforeBox}>
                <Text style={styles.modalBoxLabel}>Before</Text>
                <Text style={styles.modalWrongText}>{result.input}</Text>
              </View>

              <View style={styles.modalAfterBox}>
                <Text style={styles.modalBoxLabelGreen}>Correct Sentence</Text>
                <Text style={styles.modalCorrectText}>{result.corrected}</Text>

                <TouchableOpacity
                  style={styles.modalListenSmall}
                  onPress={() => speakText(result.corrected)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="volume-high-outline"
                    size={17}
                    color={ACTION_COLOR}
                  />
                  <Text style={styles.modalListenSmallText}>Listen</Text>
                </TouchableOpacity>
              </View>

              {/* Mistakes */}
              <View style={styles.modalMistakeBox}>
                <View style={styles.modalTitleRow}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color={ACTION_COLOR}
                  />
                  <Text style={styles.modalSectionTitle}>Mistakes Found</Text>
                </View>

                <View style={styles.modalMistakeWrap}>
                  {result.mistakes.map((mistake) => (
                    <View key={mistake} style={styles.modalMistakeChip}>
                      <Text style={styles.modalMistakeText}>{mistake}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Explanation */}
              <View style={styles.modalExplanationBox}>
                <View style={styles.modalExplanationHeader}>
                  <View style={styles.modalTitleRow}>
                    <MaterialCommunityIcons
                      name={
                        selectedMode === "Teaching Mode"
                          ? "school-outline"
                          : "chat-processing-outline"
                      }
                      size={20}
                      color={ACTION_COLOR}
                    />
                    <Text style={styles.modalSectionTitle}>
                      {selectedMode === "Teaching Mode"
                        ? "Teacher Explanation"
                        : "Simple Explanation"}
                    </Text>
                  </View>

                  <Text style={styles.modalLanguageText}>
                    {languageModeLabel}
                  </Text>
                </View>

                <Text style={styles.modalExplanationText}>
                  {getExplanationText()}
                </Text>
              </View>

              {/* Mode Switch */}
              <View style={styles.modalModeBox}>
                <TouchableOpacity
                  style={[
                    styles.modalModeButton,
                    selectedMode === "Easy Mode" && styles.modalModeButtonActive,
                  ]}
                  onPress={() => setSelectedMode("Easy Mode")}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={18}
                    color={
                      selectedMode === "Easy Mode" ? ACTION_COLOR : "#64748B"
                    }
                  />
                  <Text
                    style={[
                      styles.modalModeButtonText,
                      selectedMode === "Easy Mode" &&
                        styles.modalModeButtonTextActive,
                    ]}
                  >
                    Easy
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalModeButton,
                    selectedMode === "Teaching Mode" &&
                      styles.modalModeButtonActive,
                  ]}
                  onPress={() => setSelectedMode("Teaching Mode")}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="school-outline"
                    size={18}
                    color={
                      selectedMode === "Teaching Mode"
                        ? ACTION_COLOR
                        : "#64748B"
                    }
                  />
                  <Text
                    style={[
                      styles.modalModeButtonText,
                      selectedMode === "Teaching Mode" &&
                        styles.modalModeButtonTextActive,
                    ]}
                  >
                    Teacher
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Pattern */}
              <View style={styles.modalPatternBox}>
                <Text style={styles.modalPatternLabel}>Speaking pattern</Text>
                <Text style={styles.modalPatternText}>{result.pattern}</Text>
              </View>

              {/* Repeat Task */}
              <View style={styles.modalRepeatBox}>
                <View style={styles.modalTitleRow}>
                  <Ionicons name="repeat-outline" size={20} color={ACTION_COLOR} />
                  <Text style={styles.modalSectionTitle}>Repeat Task</Text>
                </View>

                <Text style={styles.modalRepeatText}>{result.repeatTask}</Text>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalLightButton}
                onPress={() => speakText(result.corrected)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="volume-high-outline"
                  size={18}
                  color={ACTION_COLOR}
                />
                <Text style={styles.modalLightButtonText}>Listen</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={startRepeatFromModal}
                activeOpacity={0.85}
              >
                <Ionicons name="mic-outline" size={18} color="#FFFFFF" />
                <Text style={styles.modalPrimaryButtonText}>Start Repeat</Text>
              </TouchableOpacity>
            </View>
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

 

  inputCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  cardTextBox: {
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
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  input: {
    marginTop: 14,
    minHeight: 88,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    padding: 14,
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "700",
    textAlignVertical: "top",
  },

  analyzeButton: {
    height: 48,
    borderRadius: 15,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 12,
  },

  analyzeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 7,
  },

  demoRow: {
    gap: 10,
    paddingRight: 18,
    marginBottom: 18,
  },

  demoCard: {
    width: 220,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  demoCardActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  demoWrongBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
  },

  demoWrong: {
    fontSize: 13,
    fontWeight: "900",
    color: "#991B1B",
  },

  demoWrongActive: {
    color: "#0F172A",
  },

  demoCorrect: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "800",
  },

  repeatCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  repeatTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  repeatIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  repeatTitleBox: {
    flex: 1,
    paddingRight: 10,
  },

  repeatTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },

  repeatSubtitle: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    fontWeight: "600",
  },

  listenMiniButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  repeatSentenceBox: {
    marginTop: 13,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  repeatSentence: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "900",
    color: "#0F172A",
  },

  repeatRecordingBox: {
    marginTop: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },

  repeatRecordingBoxActive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },

  repeatMicCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  repeatWaveBox: {
    height: 38,
    width: 92,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginRight: 10,
    overflow: "hidden",
  },

  repeatWaveBar: {
    width: 7,
    borderRadius: 999,
    backgroundColor: "#DC2626",
  },

  repeatStatusBox: {
    flex: 1,
  },

  repeatStatusTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 3,
  },

  repeatStatusText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#64748B",
    fontWeight: "600",
  },

  repeatSavedBox: {
    marginTop: 12,
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    flexDirection: "row",
    alignItems: "center",
  },

  repeatSavedText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 18,
    color: "#166534",
    fontWeight: "800",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 13,
  },

  lightButton: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  lightButtonText: {
    color: ACTION_COLOR,
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 7,
  },

  primaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  primaryButtonRecording: {
    backgroundColor: "#DC2626",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 7,
  },

  futureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
  },

  futureHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  futureIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  futureTitleBox: {
    flex: 1,
  },

  futureTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 3,
  },

  futureSubtitle: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    fontWeight: "600",
  },

  futureList: {
    gap: 8,
  },

  futureItemRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  futureItemText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 18,
    color: "#334155",
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    padding: 18,
  },

  modalCard: {
    maxHeight: "88%",
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  modalIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  modalTitleBox: {
    flex: 1,
  },

  modalLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "900",
    marginBottom: 3,
  },

  modalTitle: {
    fontSize: 19,
    color: "#0F172A",
    fontWeight: "900",
  },

  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  modalScroll: {
    maxHeight: 470,
  },

  modalScoreRow: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  modalScoreLabel: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "900",
  },

  modalScoreSubLabel: {
    marginTop: 3,
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },

  modalScoreValue: {
    fontSize: 18,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  modalBeforeBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 10,
  },

  modalAfterBox: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 12,
  },

  modalBoxLabel: {
    fontSize: 12,
    color: "#991B1B",
    fontWeight: "900",
    marginBottom: 5,
  },

  modalBoxLabelGreen: {
    fontSize: 12,
    color: "#166534",
    fontWeight: "900",
    marginBottom: 5,
  },

  modalWrongText: {
    fontSize: 17,
    lineHeight: 24,
    color: "#991B1B",
    fontWeight: "900",
  },

  modalCorrectText: {
    fontSize: 18,
    lineHeight: 25,
    color: "#166534",
    fontWeight: "900",
  },

  modalListenSmall: {
    marginTop: 9,
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
  },

  modalListenSmallText: {
    marginLeft: 5,
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  modalMistakeBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },

  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  modalSectionTitle: {
    marginLeft: 7,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
  },

  modalMistakeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  modalMistakeChip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  modalMistakeText: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "800",
  },

  modalExplanationBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },

  modalExplanationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  modalLanguageText: {
    fontSize: 11,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  modalExplanationText: {
    fontSize: 13,
    lineHeight: 21,
    color: "#334155",
    fontWeight: "700",
  },

  modalModeBox: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  modalModeButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  modalModeButtonActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  modalModeButtonText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "900",
  },

  modalModeButtonTextActive: {
    color: ACTION_COLOR,
  },

  modalPatternBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 13,
    marginBottom: 10,
  },

  modalPatternLabel: {
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
    marginBottom: 5,
  },

  modalPatternText: {
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "900",
  },

  modalRepeatBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 4,
  },

  modalRepeatText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#334155",
    fontWeight: "700",
  },

  modalActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  modalLightButton: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  modalLightButtonText: {
    marginLeft: 7,
    fontSize: 14,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  modalPrimaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  modalPrimaryButtonText: {
    marginLeft: 7,
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "900",
  },
});