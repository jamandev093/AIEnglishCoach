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

type PracticeState = "idle" | "recording" | "checked";
type RepeatState = "idle" | "repeat" | "saved";

type WordMeaning = {
  word: string;
  english: string;
  hindi: string;
  bengali: string;
};

type PracticeSentence = {
  id: string;
  sentence: string;
  englishMeaning: string;
  hindiMeaning: string;
  bengaliMeaning: string;
  wordMeanings: WordMeaning[];
  focusSound: string;
  correctionTip: string;
  smartSuggestion: string;
};

const ACTION_COLOR = "#8499DC";

const practiceSentences: PracticeSentence[] = [
  {
    id: "market",
    sentence: "I went to the market.",
    englishMeaning: "I visited the market in the past.",
    hindiMeaning: "मैं बाज़ार गया था।",
    bengaliMeaning: "আমি বাজারে গিয়েছিলাম।",
    focusSound: "went, market",
    correctionTip:
      "Say “went” clearly. Do not make it sound like “wan”. Keep the ending soft but clear.",
    smartSuggestion: "Yesterday, I went to the market with my brother.",
    wordMeanings: [
      {
        word: "went",
        english: "visited or moved to a place in the past",
        hindi: "गया था",
        bengali: "গিয়েছিলাম",
      },
      {
        word: "market",
        english: "a place where people buy things",
        hindi: "बाज़ार",
        bengali: "বাজার",
      },
    ],
  },
  {
    id: "english",
    sentence: "I am learning English.",
    englishMeaning: "I am studying and practicing English now.",
    hindiMeaning: "मैं अंग्रेज़ी सीख रहा हूँ।",
    bengaliMeaning: "আমি ইংরেজি শিখছি।",
    focusSound: "learning, English",
    correctionTip:
      "Say “learning” slowly. Do not skip the “r” sound. Say “English” clearly.",
    smartSuggestion: "I am learning English to speak with confidence.",
    wordMeanings: [
      {
        word: "learning",
        english: "studying or practicing something",
        hindi: "सीखना",
        bengali: "শেখা",
      },
      {
        word: "English",
        english: "the English language",
        hindi: "अंग्रेज़ी भाषा",
        bengali: "ইংরেজি ভাষা",
      },
    ],
  },
  {
    id: "repeat",
    sentence: "Could you repeat that slowly?",
    englishMeaning: "Please say that again slowly.",
    hindiMeaning: "क्या आप उसे धीरे-धीरे दोहरा सकते हैं?",
    bengaliMeaning: "আপনি কি এটা ধীরে আবার বলতে পারেন?",
    focusSound: "could, repeat, slowly",
    correctionTip:
      "Say “could you” smoothly together. Keep “repeat” clear: re-peat.",
    smartSuggestion: "Could you repeat that slowly, please?",
    wordMeanings: [
      {
        word: "repeat",
        english: "say again",
        hindi: "दोहराना",
        bengali: "আবার বলা",
      },
      {
        word: "slowly",
        english: "not fast",
        hindi: "धीरे",
        bengali: "ধীরে",
      },
    ],
  },
];

export default function PronunciationsScreen() {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const [selectedSentence, setSelectedSentence] = useState<PracticeSentence>(
    practiceSentences[0]
  );

  const [practiceState, setPracticeState] = useState<PracticeState>("idle");
  const [repeatState, setRepeatState] = useState<RepeatState>("idle");
  const [showResultPopup, setShowResultPopup] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barOne = useRef(new Animated.Value(12)).current;
  const barTwo = useRef(new Animated.Value(26)).current;
  const barThree = useRef(new Animated.Value(16)).current;
  const barFour = useRef(new Animated.Value(31)).current;
  const barFive = useRef(new Animated.Value(20)).current;

  useFocusEffect(
    useCallback(() => {
      const loadProfileAndSettings = async () => {
        const savedProfile = await getProfile();
        const savedSettings = await getSettings();

        setProfile(savedProfile);
        setSettings(savedSettings);
      };

      loadProfileAndSettings();
    }, [])
  );

  const isListening = practiceState === "recording" || repeatState === "repeat";

  useEffect(() => {
    if (!isListening) {
      pulseAnim.setValue(1);
      barOne.setValue(12);
      barTwo.setValue(26);
      barThree.setValue(16);
      barFour.setValue(31);
      barFive.setValue(20);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.07,
          duration: 520,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
        }),
      ])
    );

    const waveLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(barOne, {
            toValue: 34,
            duration: 430,
            useNativeDriver: false,
          }),
          Animated.timing(barOne, {
            toValue: 12,
            duration: 430,
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.timing(barTwo, {
            toValue: 14,
            duration: 460,
            useNativeDriver: false,
          }),
          Animated.timing(barTwo, {
            toValue: 32,
            duration: 460,
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.timing(barThree, {
            toValue: 38,
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
            toValue: 18,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(barFour, {
            toValue: 35,
            duration: 500,
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.timing(barFive, {
            toValue: 36,
            duration: 450,
            useNativeDriver: false,
          }),
          Animated.timing(barFive, {
            toValue: 18,
            duration: 450,
            useNativeDriver: false,
          }),
        ]),
      ])
    );

    pulseLoop.start();
    waveLoop.start();

    return () => {
      pulseLoop.stop();
      waveLoop.stop();
    };
  }, [
    isListening,
    pulseAnim,
    barOne,
    barTwo,
    barThree,
    barFour,
    barFive,
  ]);

  const displayLanguage = getDisplayLanguage(profile, settings);
  const languageModeLabel = getLanguageModeLabel(profile, settings);

  const getSentenceMeaning = () => {
    if (displayLanguage === "Bengali") return selectedSentence.bengaliMeaning;
    if (displayLanguage === "Hindi") return selectedSentence.hindiMeaning;
    return selectedSentence.englishMeaning;
  };

  const getWordMeaning = (item: WordMeaning) => {
    if (displayLanguage === "Bengali") return item.bengali;
    if (displayLanguage === "Hindi") return item.hindi;
    return item.english;
  };

  const wordMeaningLine = selectedSentence.wordMeanings
    .map((item) => `${item.word} (${getWordMeaning(item)})`)
    .join(", ");

  const speakText = (text: string) => {
    if (!text.trim()) return;

    Speech.stop();
    Speech.speak(text, {
      language: "en-US",
      rate: 0.84,
    });
  };

  const chooseSentence = (sentence: PracticeSentence) => {
    setSelectedSentence(sentence);
    setPracticeState("idle");
    setRepeatState("idle");
    setShowResultPopup(false);
  };

  const savePronunciationActivity = async () => {
    await addActivity({
      type: "pronunciation",
      title: "Pronunciation practice",
      detail: `Repeated: ${selectedSentence.sentence}`,
      score: 78,
      confidence: 66,
      fluency: 64,
      mistake: selectedSentence.correctionTip,
      correctedSentence: selectedSentence.sentence,
    });
  };

  const saveRepeatLoopActivity = async () => {
    await addActivity({
      type: "pronunciation",
      title: "Repeat after me correction",
      detail: `Repeated correction: ${selectedSentence.sentence}`,
      score: 82,
      confidence: 68,
      fluency: 67,
      mistake: selectedSentence.correctionTip,
      correctedSentence: selectedSentence.sentence,
    });
  };

  const handleMainButton = async () => {
    if (repeatState === "repeat") {
      setRepeatState("saved");
      await saveRepeatLoopActivity();
      return;
    }

    if (repeatState === "saved") {
      setRepeatState("idle");
      setPracticeState("idle");
      return;
    }

    if (practiceState === "idle") {
      setPracticeState("recording");
      return;
    }

    if (practiceState === "recording") {
      setPracticeState("checked");
      setShowResultPopup(true);
      await savePronunciationActivity();
      return;
    }

    setPracticeState("recording");
  };

  const startRepeatFromPopup = () => {
    setShowResultPopup(false);
    setPracticeState("idle");
    setRepeatState("repeat");
  };

  const getMainButtonText = () => {
    if (repeatState === "repeat") return "Stop & Save Repeat";
    if (repeatState === "saved") return "Practice Again";
    if (practiceState === "idle") return "Start Practice";
    if (practiceState === "recording") return "Stop & Check";
    return "Practice Again";
  };

  const getMainButtonIcon = (): keyof typeof Ionicons.glyphMap => {
    if (repeatState === "repeat") return "stop";
    if (repeatState === "saved") return "refresh-outline";
    if (practiceState === "idle") return "mic-outline";
    if (practiceState === "recording") return "stop";
    return "refresh-outline";
  };

  const getRecordingTitle = () => {
    if (repeatState === "repeat") return "Repeat after me";
    if (repeatState === "saved") return "Repeat saved";
    if (practiceState === "idle") return "Ready to speak";
    if (practiceState === "recording") return "Listening...";
    return "Practice result ready";
  };

  const getRecordingText = () => {
    if (repeatState === "repeat") {
      return "Say the corrected sentence again. Focus on the correction from the popup.";
    }

    if (repeatState === "saved") {
      return "Repeat-after-me correction was saved to Progress.";
    }

    if (practiceState === "idle") {
      return "Listen once, then say the sentence clearly.";
    }

    if (practiceState === "recording") {
      return "Speak slowly. Focus on clarity, not speed.";
    }

    return "Your pronunciation result is ready. Open the popup for feedback.";
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
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Pronunciation</Text>

          <View style={styles.emptyBox} />
        </View>

        {/* Suggested Sentences */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Suggested Sentences</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sentenceRow}
        >
          {practiceSentences.map((item) => {
            const active = selectedSentence.id === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.sentenceCard,
                  active && styles.sentenceCardActive,
                ]}
                onPress={() => chooseSentence(item)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.sentenceCardText,
                    active && styles.sentenceCardTextActive,
                  ]}
                >
                  {item.sentence}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Main Practice Card */}
        <View style={styles.practiceCard}>
          <View style={styles.practiceTopRow}>
            <View style={styles.practiceTitleBox}>
              <Text style={styles.practiceLabel}>Practice Sentence</Text>
              <Text style={styles.practiceSentence}>
                {selectedSentence.sentence}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.listenCircle}
              onPress={() => speakText(selectedSentence.sentence)}
              activeOpacity={0.85}
            >
              <Ionicons name="volume-high" size={23} color={ACTION_COLOR} />
            </TouchableOpacity>
          </View>

          <View style={styles.meaningBox}>
            <View style={styles.meaningHeaderRow}>
              <Text style={styles.meaningLabel}>Meaning</Text>

              <View style={styles.languagePill}>
                <Text style={styles.languagePillText}>{languageModeLabel}</Text>
              </View>
            </View>

            <Text style={styles.meaningText}>{getSentenceMeaning()}</Text>

            <Text style={styles.wordMeaningText}>{wordMeaningLine}</Text>
          </View>

          <View
            style={[styles.recordingBox, isListening && styles.recordingBoxActive]}
          >
            <Animated.View
              style={[
                styles.micCircle,
                isListening && {
                  backgroundColor: ACTION_COLOR,
                  borderColor: ACTION_COLOR,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Ionicons
                name={isListening ? "mic" : "mic-outline"}
                size={32}
                color={isListening ? "#FFFFFF" : ACTION_COLOR}
              />
            </Animated.View>

            <View style={styles.waveBox}>
              <Animated.View style={[styles.waveBar, { height: barOne }]} />
              <Animated.View style={[styles.waveBar, { height: barTwo }]} />
              <Animated.View style={[styles.waveBar, { height: barThree }]} />
              <Animated.View style={[styles.waveBar, { height: barFour }]} />
              <Animated.View style={[styles.waveBar, { height: barFive }]} />
            </View>

            <Text style={styles.recordingTitle}>{getRecordingTitle()}</Text>
            <Text style={styles.recordingText}>{getRecordingText()}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.mainButton,
              isListening && styles.mainButtonRecording,
            ]}
            onPress={handleMainButton}
            activeOpacity={0.85}
          >
            <Ionicons name={getMainButtonIcon()} size={20} color="#FFFFFF" />
            <Text style={styles.mainButtonText}>{getMainButtonText()}</Text>
          </TouchableOpacity>

          {practiceState === "checked" && repeatState !== "repeat" && (
            <TouchableOpacity
              style={styles.openResultButton}
              onPress={() => setShowResultPopup(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="expand-outline" size={18} color={ACTION_COLOR} />
              <Text style={styles.openResultButtonText}>
                Open Practice Result
              </Text>
            </TouchableOpacity>
          )}

          {repeatState === "saved" && (
            <View style={styles.savedRepeatBox}>
              <Ionicons name="checkmark-circle" size={21} color="#16A34A" />
              <Text style={styles.savedRepeatText}>
                Repeat-after-me correction saved to Progress.
              </Text>
            </View>
          )}
        </View>

        {/* Coming Soon */}
        <View style={styles.futureCard}>
          <View style={styles.futureHeaderRow}>
            <View style={styles.futureIcon}>
              <Ionicons name="sparkles-outline" size={22} color={ACTION_COLOR} />
            </View>

            <View style={styles.futureTitleBox}>
              <Text style={styles.futureTitle}>Coming Soon</Text>
              <Text style={styles.futureSubtitle}>
                Real AI pronunciation scoring will connect after speech backend.
              </Text>
            </View>
          </View>

          {[
            "Real microphone audio analysis",
            "AI pronunciation clarity score",
            "Fluency and repeat accuracy",
            "Automatic mistake memory",
            "Smarter sentence suggestions",
          ].map((item) => (
            <View key={item} style={styles.futureItemRow}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={ACTION_COLOR}
              />
              <Text style={styles.futureItemText}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Standard Practice Result Popup */}
      <Modal
        visible={showResultPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResultPopup(false)}
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
                <Text style={styles.modalLabel}>Practice Result</Text>
                <Text style={styles.modalTitle}>
                  Pronunciation feedback ready
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowResultPopup(false)}
              >
                <Ionicons name="close" size={21} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Scores */}
              <View style={styles.scoreGrid}>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreValue}>78%</Text>
                  <Text style={styles.scoreLabel}>Clarity</Text>
                </View>

                <View style={styles.scoreBox}>
                  <Text style={styles.scoreValue}>64%</Text>
                  <Text style={styles.scoreLabel}>Fluency</Text>
                </View>

                <View style={styles.scoreBox}>
                  <Text style={styles.scoreValue}>82%</Text>
                  <Text style={styles.scoreLabel}>Repeat</Text>
                </View>
              </View>

              {/* Target Sentence */}
              <View style={styles.modalSentenceBox}>
                <Text style={styles.modalSectionTitle}>Target sentence</Text>
                <Text style={styles.modalSentence}>
                  {selectedSentence.sentence}
                </Text>

                <TouchableOpacity
                  style={styles.modalSmallButton}
                  onPress={() => speakText(selectedSentence.sentence)}
                >
                  <Ionicons
                    name="volume-high-outline"
                    size={17}
                    color={ACTION_COLOR}
                  />
                  <Text style={styles.modalSmallButtonText}>Listen</Text>
                </TouchableOpacity>
              </View>

              {/* AI Teacher Feedback */}
              <View style={styles.modalTeacherBox}>
                <View style={styles.teacherIcon}>
                  <MaterialCommunityIcons
                    name="robot-happy-outline"
                    size={22}
                    color={ACTION_COLOR}
                  />
                </View>

                <View style={styles.teacherTextBox}>
                  <Text style={styles.teacherTitle}>AI Teacher Feedback</Text>
                  <Text style={styles.teacherText}>
                    Good practice. Your clarity is improving. Now repeat the
                    sentence again and focus on: {selectedSentence.focusSound}.
                  </Text>
                </View>
              </View>

              {/* Mistake Memory */}
              <View style={styles.modalMemoryBox}>
                <View style={styles.modalMemoryTopRow}>
                  <MaterialCommunityIcons
                    name="brain"
                    size={23}
                    color={ACTION_COLOR}
                  />
                  <Text style={styles.modalMemoryTitle}>Mistake Memory</Text>
                </View>

                <Text style={styles.modalMemoryLabel}>Current focus sound</Text>
                <Text style={styles.modalMemoryValue}>
                  {selectedSentence.focusSound}
                </Text>

                <Text style={styles.modalMemoryText}>
                  This pronunciation focus was saved to Progress. Later AI will
                  remember repeated sound mistakes automatically.
                </Text>
              </View>

              {/* Smart Suggestion */}
              <View style={styles.modalSuggestionBox}>
                <Text style={styles.modalSectionTitle}>
                  Smart sentence suggestion
                </Text>
                <Text style={styles.modalSuggestionText}>
                  {selectedSentence.smartSuggestion}
                </Text>

                <TouchableOpacity
                  style={styles.modalSmallButton}
                  onPress={() => speakText(selectedSentence.smartSuggestion)}
                >
                  <Ionicons
                    name="volume-high-outline"
                    size={17}
                    color={ACTION_COLOR}
                  />
                  <Text style={styles.modalSmallButtonText}>Listen</Text>
                </TouchableOpacity>
              </View>

              {/* Repeat After Me Loop - Last Position */}
              <View style={styles.modalRepeatBox}>
                <View style={styles.modalRepeatTopRow}>
                  <View style={styles.modalRepeatIcon}>
                    <Ionicons
                      name="repeat-outline"
                      size={23}
                      color={ACTION_COLOR}
                    />
                  </View>

                  <View style={styles.modalRepeatTextBox}>
                    <Text style={styles.modalRepeatTitle}>
                      Repeat After Me Loop
                    </Text>
                    <Text style={styles.modalRepeatSubtitle}>
                      Last step: repeat the corrected sentence and save it to
                      Progress.
                    </Text>
                  </View>
                </View>

                <View style={styles.modalCorrectionBox}>
                  <Text style={styles.modalCorrectionLabel}>
                    Correction focus
                  </Text>
                  <Text style={styles.modalCorrectionText}>
                    {selectedSentence.correctionTip}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalLightButton}
                onPress={() => speakText(selectedSentence.sentence)}
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
                onPress={startRepeatFromPopup}
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
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
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

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },

  sentenceRow: {
    gap: 10,
    paddingRight: 18,
    marginBottom: 18,
  },

  sentenceCard: {
    maxWidth: 240,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sentenceCardActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  sentenceCardText: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "800",
  },

  sentenceCardTextActive: {
    color: ACTION_COLOR,
  },

  practiceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  practiceTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  practiceTitleBox: {
    flex: 1,
    paddingRight: 12,
  },

  practiceLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "900",
    marginBottom: 6,
  },

  practiceSentence: {
    fontSize: 23,
    lineHeight: 31,
    color: "#0F172A",
    fontWeight: "900",
  },

  listenCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  meaningBox: {
    marginTop: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  meaningHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  meaningLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: ACTION_COLOR,
  },

  languagePill: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  languagePillText: {
    color: ACTION_COLOR,
    fontSize: 11,
    fontWeight: "900",
  },

  meaningText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#334155",
    fontWeight: "700",
  },

  wordMeaningText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    fontWeight: "800",
  },

  recordingBox: {
    marginTop: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    overflow: "hidden",
  },

  recordingBoxActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  micCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  waveBox: {
    width: 146,
    height: 48,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginBottom: 12,
  },

  waveBar: {
    width: 8,
    borderRadius: 999,
    backgroundColor: ACTION_COLOR,
  },

  recordingTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 5,
  },

  recordingText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    fontWeight: "700",
    textAlign: "center",
  },

  mainButton: {
    height: 52,
    borderRadius: 17,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 16,
  },

  mainButtonRecording: {
    backgroundColor: "#111827",
  },

  mainButtonText: {
    marginLeft: 8,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  openResultButton: {
    height: 46,
    borderRadius: 15,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 12,
  },

  openResultButtonText: {
    marginLeft: 7,
    color: ACTION_COLOR,
    fontSize: 14,
    fontWeight: "900",
  },

  savedRepeatBox: {
    marginTop: 13,
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    flexDirection: "row",
    alignItems: "center",
  },

  savedRepeatText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#166534",
    fontWeight: "800",
  },

  futureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
  },

  futureHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  futureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  futureTitleBox: {
    flex: 1,
  },

  futureTitle: {
    fontSize: 18,
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

  futureItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 9,
  },

  futureItemText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    lineHeight: 19,
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
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  modalScroll: {
    maxHeight: 470,
  },

  scoreGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  scoreBox: {
    flex: 1,
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 13,
    alignItems: "center",
  },

  scoreValue: {
    fontSize: 20,
    color: ACTION_COLOR,
    fontWeight: "900",
    marginBottom: 4,
  },

  scoreLabel: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "900",
  },

  modalSentenceBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },

  modalSectionTitle: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 8,
  },

  modalSentence: {
    fontSize: 18,
    lineHeight: 25,
    color: "#0F172A",
    fontWeight: "900",
  },

  modalSmallButton: {
    marginTop: 9,
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
  },

  modalSmallButtonText: {
    marginLeft: 5,
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  modalTeacherBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  teacherIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  teacherTextBox: {
    flex: 1,
  },

  teacherTitle: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 4,
  },

  teacherText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#334155",
    fontWeight: "700",
  },

  modalMemoryBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },

  modalMemoryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  modalMemoryTitle: {
    marginLeft: 7,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
  },

  modalMemoryLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "900",
    marginBottom: 4,
  },

  modalMemoryValue: {
    fontSize: 16,
    color: ACTION_COLOR,
    fontWeight: "900",
    marginBottom: 8,
  },

  modalMemoryText: {
    fontSize: 13,
    lineHeight: 21,
    color: "#334155",
    fontWeight: "700",
  },

  modalSuggestionBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    marginBottom: 12,
  },

  modalSuggestionText: {
    fontSize: 15,
    lineHeight: 23,
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

  modalRepeatTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  modalRepeatIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  modalRepeatTextBox: {
    flex: 1,
  },

  modalRepeatTitle: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 4,
  },

  modalRepeatSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "700",
  },

  modalCorrectionBox: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  modalCorrectionLabel: {
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
    marginBottom: 5,
  },

  modalCorrectionText: {
    fontSize: 13,
    lineHeight: 21,
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