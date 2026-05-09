import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { analyzeSentenceWithBackend } from "../config/api";
import { addActivity } from "../utils/activityHistory";

import {
  defaultProfile,
  getProfile,
  ProfileData,
} from "../utils/profileStore";

import {
  AppSettings,
  defaultSettings,
  getSettings,
} from "../utils/settingsStore";

import {
  getDisplayLanguage,
  getLanguageModeLabel,
} from "../utils/languageMode";

type SentenceTask = {
  title: string;
  pattern: string;
  words: string[];
  correctSentence: string;
  englishMeaning: string;
  meaningHindi: string;
  meaningBengali: string;
  simpleRule: string;
  teacherExplanation: string;
  speakingTask: string;
  smartSuggestion: string;
};

type CheckResult = "idle" | "correct" | "wrong";
type RepeatState = "idle" | "recording" | "saved";

type BackendSentenceResult = {
  originalText: string;
  correctedText: string;
  score: number;
  mistakes: string[];
  simpleExplanation: string;
  teacherExplanation: string;
  smartSuggestion: string;
  repeatSentence: string;
};

const ACTION_COLOR = "#8499DC";
const RECORDING_COLOR = "#DC2626";

const tasks: SentenceTask[] = [
  {
    title: "Daily Life Sentence",
    pattern: "Subject + Verb + Place",
    words: ["I", "went", "to", "the", "market"],
    correctSentence: "I went to the market.",
    englishMeaning: "I visited the market in the past.",
    meaningHindi: "मैं बाज़ार गया था।",
    meaningBengali: "আমি বাজারে গিয়েছিলাম।",
    simpleRule: "Past action: use “went”. For a place, use “to”.",
    teacherExplanation:
      "This sentence talks about a past action. We do not say “I go market” here. We say “I went to the market” because “went” shows past time and “to” connects the action with the place.",
    speakingTask: "Say one sentence about where you went yesterday.",
    smartSuggestion: "Yesterday, I went to the market with my brother.",
  },
  {
    title: "Food Sentence",
    pattern: "Subject + Verb + Object",
    words: ["I", "eat", "an", "apple"],
    correctSentence: "I eat an apple.",
    englishMeaning: "I eat one apple.",
    meaningHindi: "मैं एक सेब खाता हूँ।",
    meaningBengali: "আমি একটি আপেল খাই।",
    simpleRule: "Use “an” before words that start with a vowel sound.",
    teacherExplanation:
      "The word “apple” starts with a vowel sound, so we use “an apple”. The natural order is subject first, then verb, then object: I eat an apple.",
    speakingTask: "Say one sentence about what you eat every day.",
    smartSuggestion: "Every morning, I eat an apple before school.",
  },
  {
    title: "Work Sentence",
    pattern: "Subject + Verb + Place",
    words: ["I", "go", "to", "the", "office"],
    correctSentence: "I go to the office.",
    englishMeaning: "I visit the office regularly.",
    meaningHindi: "मैं ऑफिस जाता हूँ।",
    meaningBengali: "আমি অফিসে যাই।",
    simpleRule: "When going somewhere, say “go to” a place.",
    teacherExplanation:
      "When we talk about going to a place, we usually use “to” before the place. So we say “I go to the office”, not “I go office”.",
    speakingTask: "Say one sentence about where you go every day.",
    smartSuggestion: "I go to the office every morning by bus.",
  },
];

export default function SentenceBuildingScreen() {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const [selectedTask, setSelectedTask] = useState<SentenceTask>(tasks[0]);
  const [typedSentence, setTypedSentence] = useState("");
  const [result, setResult] = useState<CheckResult>("idle");
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [repeatState, setRepeatState] = useState<RepeatState>("idle");
  const [backendResult, setBackendResult] =
    useState<BackendSentenceResult | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barOne = useRef(new Animated.Value(12)).current;
  const barTwo = useRef(new Animated.Value(26)).current;
  const barThree = useRef(new Animated.Value(16)).current;
  const barFour = useRef(new Animated.Value(31)).current;

  useFocusEffect(
    useCallback(() => {
      const loadProfileAndSettings = async () => {
        try {
          const savedProfile = await getProfile();
          const savedSettings = await getSettings();

          setProfile(savedProfile);
          setSettings(savedSettings);
        } catch (error) {
          console.log("Failed to load profile/settings:", error);
        }
      };

      loadProfileAndSettings();
    }, [])
  );

  useEffect(() => {
    if (repeatState !== "recording") {
      pulseAnim.setValue(1);
      barOne.setValue(12);
      barTwo.setValue(26);
      barThree.setValue(16);
      barFour.setValue(31);
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
      ])
    );

    pulseLoop.start();
    waveLoop.start();

    return () => {
      pulseLoop.stop();
      waveLoop.stop();
    };
  }, [repeatState, pulseAnim, barOne, barTwo, barThree, barFour]);

  const displayLanguage = getDisplayLanguage(profile, settings);
  const languageModeLabel = getLanguageModeLabel(profile, settings);

  const builtSentence = typedSentence.trim();
  const isCorrect = result === "correct";

  const popupCorrectSentence =
    backendResult?.correctedText || selectedTask.correctSentence;

  const popupScore = backendResult?.score ?? (isCorrect ? 90 : 55);

  const popupMistakes =
    backendResult?.mistakes && backendResult.mistakes.length > 0
      ? backendResult.mistakes
      : isCorrect
      ? ["No major mistake found"]
      : ["Word order / sentence pattern"];

  const popupCorrection = backendResult?.simpleExplanation || selectedTask.simpleRule;

  const popupTeacherExplanation =
    backendResult?.teacherExplanation || selectedTask.teacherExplanation;

  const popupSmartSuggestion =
    backendResult?.smartSuggestion || selectedTask.smartSuggestion;

  const popupRepeatSentence =
    backendResult?.repeatSentence ||
    backendResult?.correctedText ||
    selectedTask.correctSentence;

  const getTaskMeaning = () => {
    if (displayLanguage === "Bengali") return selectedTask.meaningBengali;
    if (displayLanguage === "Hindi") return selectedTask.meaningHindi;
    return selectedTask.englishMeaning;
  };

  const typedWords = useMemo(() => {
    return typedSentence
      .toLowerCase()
      .replace(/[.?!]/g, "")
      .split(/\s+/)
      .filter(Boolean);
  }, [typedSentence]);

  const smartWordSuggestions = useMemo(() => {
    return selectedTask.words.filter((word) => {
      const lowerWord = word.toLowerCase();
      const usedCount = typedWords.filter((item) => item === lowerWord).length;
      const totalCount = selectedTask.words.filter(
        (item) => item.toLowerCase() === lowerWord
      ).length;

      return usedCount < totalCount;
    });
  }, [selectedTask.words, typedWords]);

  const speakText = (text: string) => {
    if (!text.trim()) return;

    Speech.stop();
    Speech.speak(text, {
      language: "en-US",
      rate: 0.84,
    });
  };

  const chooseTask = (task: SentenceTask) => {
    Speech.stop();
    setSelectedTask(task);
    setTypedSentence("");
    setResult("idle");
    setShowResultPopup(false);
    setRepeatState("idle");
    setBackendResult(null);
  };

  const appendSuggestionWord = (word: string) => {
    setTypedSentence((prev) => {
      const clean = prev.trim();

      if (!clean) return word;
      return `${clean} ${word}`;
    });

    setResult("idle");
    setRepeatState("idle");
    setBackendResult(null);
  };

  const removeLastWord = () => {
    const parts = typedSentence.trim().split(/\s+/).filter(Boolean);
    parts.pop();
    setTypedSentence(parts.join(" "));
    setResult("idle");
    setRepeatState("idle");
    setBackendResult(null);
  };

  const resetTask = () => {
    Speech.stop();
    setTypedSentence("");
    setResult("idle");
    setShowResultPopup(false);
    setRepeatState("idle");
    setBackendResult(null);
  };

  const cleanSentence = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[.?!]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const checkSentence = async () => {
    const cleanBuilt = cleanSentence(builtSentence);
    const cleanCorrect = cleanSentence(selectedTask.correctSentence);

    if (!cleanBuilt) {
      Alert.alert(
        "Build sentence",
        "Type or tap words to build a sentence first."
      );
      return;
    }

    try {
      const apiResult = await analyzeSentenceWithBackend(builtSentence);

      const mappedBackendResult: BackendSentenceResult = {
        originalText: apiResult.originalText || builtSentence,
        correctedText:
          apiResult.correctedText ||
          apiResult.improved ||
          selectedTask.correctSentence,
        score: apiResult.score || 0,
        mistakes:
          apiResult.mistakes && apiResult.mistakes.length > 0
            ? apiResult.mistakes
            : ["No major mistake found"],
        simpleExplanation: apiResult.simpleExplanation || selectedTask.simpleRule,
        teacherExplanation:
          apiResult.teacherExplanation || selectedTask.teacherExplanation,
        smartSuggestion: apiResult.smartSuggestion || selectedTask.smartSuggestion,
        repeatSentence:
          apiResult.repeatSentence ||
          apiResult.correctedText ||
          selectedTask.correctSentence,
      };

      setBackendResult(mappedBackendResult);

      const cleanBackendCorrection = cleanSentence(mappedBackendResult.correctedText);

      const sentenceIsCorrect =
        cleanBuilt === cleanCorrect || cleanBuilt === cleanBackendCorrection;

      setResult(sentenceIsCorrect ? "correct" : "wrong");
      setShowResultPopup(true);

      await addActivity({
        type: "sentenceBuilding",
        title: sentenceIsCorrect
          ? "Sentence building"
          : "Sentence building correction",
        detail: `Tried: ${builtSentence} → Correct: ${mappedBackendResult.correctedText}`,
        score: mappedBackendResult.score,
        confidence: sentenceIsCorrect ? 72 : 62,
        fluency: sentenceIsCorrect ? 70 : 60,
        mistake: mappedBackendResult.mistakes.join(", "),
        correctedSentence: mappedBackendResult.correctedText,
      });
    } catch (error) {
      console.log("Sentence backend error:", error);

      if (cleanBuilt === cleanCorrect) {
        setBackendResult(null);
        setResult("correct");
        setShowResultPopup(true);

        await addActivity({
          type: "sentenceBuilding",
          title: "Sentence building",
          detail: `Built correctly: ${selectedTask.correctSentence}`,
          score: 90,
          confidence: 70,
          fluency: 68,
          correctedSentence: selectedTask.correctSentence,
        });

        return;
      }

      setBackendResult(null);
      setResult("wrong");
      setShowResultPopup(true);

      await addActivity({
        type: "sentenceBuilding",
        title: "Sentence building correction",
        detail: `Tried: ${builtSentence} → Correct: ${selectedTask.correctSentence}`,
        score: 55,
        mistake: "Word order / sentence pattern",
        correctedSentence: selectedTask.correctSentence,
      });
    }
  };

  const startRepeatFromPopup = () => {
    setShowResultPopup(false);
    setRepeatState("recording");
  };

  const handleSpeakAction = async () => {
    if (repeatState === "idle") {
      setRepeatState("recording");
      return;
    }

    if (repeatState === "recording") {
      setRepeatState("saved");

      try {
        await addActivity({
          type: "sentenceBuilding",
          title: "Sentence repeat practice",
          detail: `Repeated: ${popupRepeatSentence}`,
          score: 82,
          confidence: 72,
          fluency: 70,
          correctedSentence: popupRepeatSentence,
        });
      } catch (error) {
        console.log("Failed to save repeat activity:", error);
      }

      return;
    }

    setRepeatState("idle");
  };

  const getSpeakButtonText = () => {
    if (repeatState === "recording") return "Stop & Save";
    if (repeatState === "saved") return "Practice Again";
    return "Speak";
  };

  const getSpeakButtonIcon = (): keyof typeof Ionicons.glyphMap => {
    if (repeatState === "recording") return "stop";
    if (repeatState === "saved") return "refresh-outline";
    return "mic-outline";
  };

  const getResultText = () => {
    if (isCorrect) {
      return "Correct. You built the sentence in the right order.";
    }

    return "Not correct yet. Your sentence has been corrected below.";
  };

  return (
    <>
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

          <Text style={styles.headerTitle}>Sentence Building</Text>

          <View style={styles.emptyBox} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choose Practice</Text>
          <Text style={styles.sectionSubtitle}>
            Type or use smart word suggestions. Results will open in a popup.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.taskRow}
        >
          {tasks.map((task) => {
            const active = task.title === selectedTask.title;

            return (
              <TouchableOpacity
                key={task.title}
                style={[styles.taskCard, active && styles.taskCardActive]}
                onPress={() => chooseTask(task)}
                activeOpacity={0.85}
              >
                <Text style={[styles.taskTitle, active && styles.taskTitleActive]}>
                  {task.title}
                </Text>

                <Text
                  style={[
                    styles.taskPattern,
                    active && styles.taskPatternActive,
                  ]}
                >
                  {task.pattern}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.builderCard}>
          <View style={styles.builderTopRow}>
            <View style={styles.builderTextBox}>
              <Text style={styles.builderLabel}>Sentence Pattern</Text>
              <Text style={styles.patternText}>{selectedTask.pattern}</Text>
            </View>

            <View style={styles.patternIcon}>
              <MaterialCommunityIcons
                name="puzzle-outline"
                size={25}
                color={ACTION_COLOR}
              />
            </View>
          </View>

          <TextInput
            style={styles.typingBox}
            value={typedSentence}
            onChangeText={(text) => {
              setTypedSentence(text);
              setResult("idle");
              setRepeatState("idle");
              setBackendResult(null);
            }}
            placeholder="Type your sentence here..."
            placeholderTextColor="#94A3B8"
            multiline
            autoCapitalize="sentences"
          />

          <View style={styles.suggestionArea}>
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionTitle}>Smart word suggestions</Text>
              <Text style={styles.suggestionHint}>Tap to add</Text>
            </View>

            <View style={styles.wordWrap}>
              {smartWordSuggestions.length > 0 ? (
                smartWordSuggestions.map((word, index) => (
                  <TouchableOpacity
                    key={`${word}-${index}`}
                    style={styles.wordChip}
                    onPress={() => appendSuggestionWord(word)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.wordChipText}>{word}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.allWordsUsedText}>
                  All suggested words are used. You can still type manually.
                </Text>
              )}
            </View>
          </View>

          <View style={styles.correctPreviewBox}>
            <Text style={styles.correctPreviewLabel}>Correct sentence preview</Text>
            <Text style={styles.correctPreviewText}>
              {selectedTask.correctSentence}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.lightButton}
              onPress={removeLastWord}
              activeOpacity={0.85}
            >
              <Ionicons
                name="arrow-undo-outline"
                size={18}
                color={ACTION_COLOR}
              />
              <Text style={styles.lightButtonText}>Undo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={checkSentence}
              activeOpacity={0.85}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.primaryButtonText}>Check</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.grayButton}
              onPress={resetTask}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh-outline" size={18} color="#334155" />
              <Text style={styles.grayButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {result !== "idle" && (
            <TouchableOpacity
              style={styles.openResultButton}
              onPress={() => setShowResultPopup(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="expand-outline" size={18} color={ACTION_COLOR} />
              <Text style={styles.openResultButtonText}>Open Result Popup</Text>
            </TouchableOpacity>
          )}

          <View
            style={[
              styles.repeatRecordBox,
              repeatState === "recording" && styles.repeatRecordBoxActive,
            ]}
          >
            <Animated.View
              style={[
                styles.repeatMicCircle,
                repeatState === "recording" && {
                  backgroundColor: RECORDING_COLOR,
                  borderColor: RECORDING_COLOR,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Ionicons
                name={
                  repeatState === "recording"
                    ? "radio-button-on"
                    : "mic-outline"
                }
                size={27}
                color={repeatState === "recording" ? "#FFFFFF" : ACTION_COLOR}
              />
            </Animated.View>

            <View style={styles.waveBox}>
              <Animated.View style={[styles.waveBar, { height: barOne }]} />
              <Animated.View style={[styles.waveBar, { height: barTwo }]} />
              <Animated.View style={[styles.waveBar, { height: barThree }]} />
              <Animated.View style={[styles.waveBar, { height: barFour }]} />
            </View>

            <View style={styles.repeatStatusTextBox}>
              <Text style={styles.repeatStatusTitle}>
                {repeatState === "idle"
                  ? "Ready"
                  : repeatState === "recording"
                  ? "Recording..."
                  : "Practice saved"}
              </Text>

              <Text style={styles.repeatStatusText}>
                {repeatState === "idle"
                  ? "After checking, listen and speak the correct sentence."
                  : repeatState === "recording"
                  ? "Say the correct sentence clearly."
                  : "Your speaking practice was saved to Progress."}
              </Text>
            </View>
          </View>

          {repeatState === "saved" && (
            <View style={styles.savedBox}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <Text style={styles.savedText}>
                Sentence speaking practice saved to Progress.
              </Text>
            </View>
          )}

          <View style={styles.listenSpeakActionRow}>
            <TouchableOpacity
              style={styles.listenButton}
              onPress={() => speakText(popupCorrectSentence)}
              activeOpacity={0.85}
            >
              <Ionicons
                name="volume-high-outline"
                size={18}
                color={ACTION_COLOR}
              />
              <Text style={styles.listenButtonText}>Listen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.speakingButton,
                repeatState === "recording" && styles.speakingButtonActive,
              ]}
              onPress={handleSpeakAction}
              activeOpacity={0.85}
            >
              <Ionicons name={getSpeakButtonIcon()} size={18} color="#FFFFFF" />
              <Text style={styles.speakingButtonText}>
                {getSpeakButtonText()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.futureCard}>
          <View style={styles.futureHeaderRow}>
            <View style={styles.futureIcon}>
              <Ionicons name="sparkles-outline" size={22} color={ACTION_COLOR} />
            </View>

            <View style={styles.futureTitleBox}>
              <Text style={styles.futureTitle}>Coming Soon</Text>
              <Text style={styles.futureText}>
                Later, AI will check your own sentence, remember your repeated
                mistakes, and give smarter personal practice.
              </Text>
            </View>
          </View>

          {[
            "AI sentence checking",
            "Mistake memory from sentence patterns",
            "Smart sentence suggestions",
            "Activity history progress update",
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
                  name={
                    isCorrect
                      ? "checkmark-circle-outline"
                      : "sparkles-outline"
                  }
                  size={23}
                  color={ACTION_COLOR}
                />
              </View>

              <View style={styles.modalTitleBox}>
                <Text style={styles.modalLabel}>Sentence Result</Text>
                <Text style={styles.modalTitle}>
                  {isCorrect ? "Great sentence!" : "Sentence corrected"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowResultPopup(false)}
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={21} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.resultStatusBox,
                  isCorrect
                    ? styles.resultStatusGood
                    : styles.resultStatusWrong,
                ]}
              >
                <Text
                  style={[
                    styles.resultStatusLabel,
                    isCorrect
                      ? styles.resultStatusGoodText
                      : styles.resultStatusWrongText,
                  ]}
                >
                  Result
                </Text>

                <Text
                  style={[
                    styles.resultStatusText,
                    isCorrect
                      ? styles.resultStatusGoodText
                      : styles.resultStatusWrongText,
                  ]}
                >
                  {getResultText()}
                </Text>
              </View>

              <View style={styles.modalScoreBox}>
                <Text style={styles.modalScoreLabel}>Sentence score</Text>
                <Text style={styles.modalScoreValue}>{popupScore}%</Text>
              </View>

              <View
                style={[
                  styles.modalBuiltBox,
                  isCorrect ? styles.modalGoodBox : styles.modalWrongBox,
                ]}
              >
                <Text
                  style={[
                    styles.modalBoxLabel,
                    isCorrect ? styles.modalGoodLabel : styles.modalWrongLabel,
                  ]}
                >
                  Your answer
                </Text>

                <Text
                  style={[
                    styles.modalBuiltText,
                    isCorrect ? styles.modalGoodText : styles.modalWrongText,
                  ]}
                >
                  {builtSentence || "No sentence built"}
                </Text>
              </View>

              <View style={styles.modalCorrectBox}>
                <Text style={styles.modalCorrectLabel}>Correct answer</Text>
                <Text style={styles.modalCorrectText}>
                  {popupCorrectSentence}
                </Text>

                <TouchableOpacity
                  style={styles.modalSmallButton}
                  onPress={() => speakText(popupCorrectSentence)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="volume-high-outline"
                    size={17}
                    color={ACTION_COLOR}
                  />
                  <Text style={styles.modalSmallButtonText}>Listen</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalMistakeBox}>
                <View style={styles.modalRuleTopRow}>
                  <Ionicons
                    name={
                      isCorrect
                        ? "checkmark-circle-outline"
                        : "alert-circle-outline"
                    }
                    size={22}
                    color={isCorrect ? "#16A34A" : ACTION_COLOR}
                  />

                  <Text style={styles.modalMistakeTitle}>
                    {isCorrect ? "Mistake" : "Mistakes Found"}
                  </Text>
                </View>

                <Text style={styles.modalMistakeText}>
                  {popupMistakes.join(", ")}
                </Text>
              </View>

              <View style={styles.modalRuleBox}>
                <View style={styles.modalRuleTopRow}>
                  <MaterialCommunityIcons
                    name="lightbulb-on-outline"
                    size={22}
                    color={ACTION_COLOR}
                  />
                  <Text style={styles.modalRuleTitle}>Correction</Text>
                </View>

                <Text style={styles.modalRuleText}>{popupCorrection}</Text>
              </View>

              <View style={styles.teacherBox}>
                <View style={styles.modalRuleTopRow}>
                  <Ionicons
                    name="school-outline"
                    size={22}
                    color={ACTION_COLOR}
                  />
                  <Text style={styles.modalRuleTitle}>Teacher Explanation</Text>
                </View>

                <Text style={styles.modalRuleText}>
                  {popupTeacherExplanation}
                </Text>
              </View>

              <View style={styles.modalMeaningBox}>
                <View style={styles.modalMeaningHeader}>
                  <Text style={styles.modalSectionTitle}>Meaning</Text>

                  <View style={styles.languagePill}>
                    <Text style={styles.languagePillText}>
                      {languageModeLabel}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalMeaningText}>{getTaskMeaning()}</Text>
              </View>

              <View style={styles.modalSuggestionBox}>
                <Text style={styles.modalSectionTitle}>Smart Suggestion</Text>
                <Text style={styles.modalSuggestionText}>
                  {popupSmartSuggestion}
                </Text>

                <TouchableOpacity
                  style={styles.modalSmallButton}
                  onPress={() => speakText(popupSmartSuggestion)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="volume-high-outline"
                    size={17}
                    color={ACTION_COLOR}
                  />
                  <Text style={styles.modalSmallButtonText}>Listen</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalRepeatBox}>
                <View style={styles.modalRepeatTopRow}>
                  <View style={styles.modalRepeatIcon}>
                    <Ionicons
                      name="mic-outline"
                      size={23}
                      color={ACTION_COLOR}
                    />
                  </View>

                  <View style={styles.modalRepeatTextBox}>
                    <Text style={styles.modalRepeatTitle}>Repeat It</Text>
                    <Text style={styles.modalRepeatSubtitle}>
                      Tap Repeat It. The popup will close and speaking practice
                      will start inside the Sentence Pattern card.
                    </Text>
                  </View>
                </View>

                <View style={styles.modalRepeatSentenceBox}>
                  <Text style={styles.modalRepeatSentence}>
                    {popupRepeatSentence}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalLightButton}
                onPress={() => speakText(popupCorrectSentence)}
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
                <Text style={styles.modalPrimaryButtonText}>Repeat It</Text>
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

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },

  sectionSubtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
    fontWeight: "600",
  },

  taskRow: {
    gap: 10,
    paddingRight: 18,
    marginBottom: 18,
  },

  taskCard: {
    width: 180,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  taskCardActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  taskTitle: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 8,
  },

  taskTitleActive: {
    color: ACTION_COLOR,
  },

  taskPattern: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    lineHeight: 18,
  },

  taskPatternActive: {
    color: ACTION_COLOR,
  },

  builderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  builderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  builderTextBox: {
    flex: 1,
    paddingRight: 12,
  },

  builderLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "800",
    marginBottom: 4,
  },

  patternText: {
    fontSize: 18,
    fontWeight: "900",
    color: ACTION_COLOR,
  },

  patternIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  typingBox: {
    minHeight: 92,
    marginTop: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    padding: 14,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "800",
    color: "#0F172A",
    textAlignVertical: "top",
  },

  suggestionArea: {
    marginTop: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 13,
  },

  suggestionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  suggestionTitle: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "900",
  },

  suggestionHint: {
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  correctPreviewBox: {
    marginTop: 14,
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },

  correctPreviewLabel: {
    fontSize: 12,
    color: "#166534",
    fontWeight: "900",
    marginBottom: 5,
  },

  correctPreviewText: {
    fontSize: 16,
    lineHeight: 23,
    color: "#166534",
    fontWeight: "900",
  },

  wordWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  wordChip: {
    backgroundColor: "#EEF2FF",
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },

  wordChipText: {
    fontSize: 15,
    fontWeight: "900",
    color: ACTION_COLOR,
  },

  allWordsUsedText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "700",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  lightButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  lightButtonText: {
    marginLeft: 6,
    color: ACTION_COLOR,
    fontSize: 13,
    fontWeight: "900",
  },

  primaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  primaryButtonText: {
    marginLeft: 6,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  grayButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  grayButtonText: {
    marginLeft: 6,
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },

  openResultButton: {
    marginTop: 14,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  openResultButtonText: {
    marginLeft: 7,
    color: ACTION_COLOR,
    fontSize: 14,
    fontWeight: "900",
  },

  repeatRecordBox: {
    marginTop: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },

  repeatRecordBoxActive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },

  repeatMicCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  waveBox: {
    width: 82,
    height: 38,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginRight: 9,
  },

  waveBar: {
    width: 7,
    borderRadius: 999,
    backgroundColor: RECORDING_COLOR,
  },

  repeatStatusTextBox: {
    flex: 1,
  },

  repeatStatusTitle: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 3,
  },

  repeatStatusText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#64748B",
    fontWeight: "600",
  },

  savedBox: {
    marginTop: 12,
    backgroundColor: "#ECFDF5",
    borderRadius: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    flexDirection: "row",
    alignItems: "center",
  },

  savedText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 18,
    color: "#166534",
    fontWeight: "800",
  },

  listenSpeakActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 13,
  },

  listenButton: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  listenButtonText: {
    color: ACTION_COLOR,
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 7,
  },

  speakingButton: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  speakingButtonActive: {
    backgroundColor: RECORDING_COLOR,
  },

  speakingButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 7,
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
    alignItems: "flex-start",
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
    marginBottom: 5,
  },

  futureText: {
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
    maxHeight: "90%",
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
    maxHeight: 500,
  },

  resultStatusBox: {
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    marginBottom: 12,
  },

  resultStatusGood: {
    backgroundColor: "#ECFDF5",
    borderColor: "#BBF7D0",
  },

  resultStatusWrong: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },

  resultStatusLabel: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 5,
  },

  resultStatusText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "800",
  },

  resultStatusGoodText: {
    color: "#166534",
  },

  resultStatusWrongText: {
    color: "#991B1B",
  },

  modalScoreBox: {
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

  modalScoreValue: {
    fontSize: 15,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  modalBuiltBox: {
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    marginBottom: 10,
  },

  modalGoodBox: {
    backgroundColor: "#ECFDF5",
    borderColor: "#BBF7D0",
  },

  modalWrongBox: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },

  modalBoxLabel: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 5,
  },

  modalGoodLabel: {
    color: "#166534",
  },

  modalWrongLabel: {
    color: "#991B1B",
  },

  modalBuiltText: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "900",
  },

  modalGoodText: {
    color: "#166534",
  },

  modalWrongText: {
    color: "#991B1B",
  },

  modalCorrectBox: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 12,
  },

  modalCorrectLabel: {
    fontSize: 12,
    color: "#166534",
    fontWeight: "900",
    marginBottom: 5,
  },

  modalCorrectText: {
    fontSize: 18,
    lineHeight: 25,
    color: "#166534",
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

  modalMistakeBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },

  modalMistakeTitle: {
    marginLeft: 7,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
  },

  modalMistakeText: {
    fontSize: 13,
    lineHeight: 21,
    color: "#334155",
    fontWeight: "700",
  },

  modalRuleBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },

  teacherBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    marginBottom: 12,
  },

  modalRuleTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  modalRuleTitle: {
    marginLeft: 7,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
  },

  modalRuleText: {
    fontSize: 13,
    lineHeight: 21,
    color: "#334155",
    fontWeight: "700",
  },

  modalMeaningBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },

  modalMeaningHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },

  modalSectionTitle: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
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

  modalMeaningText: {
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
    marginTop: 7,
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

  modalRepeatSentenceBox: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  modalRepeatSentence: {
    fontSize: 15,
    lineHeight: 23,
    color: "#0F172A",
    fontWeight: "900",
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