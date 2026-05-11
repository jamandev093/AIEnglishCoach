import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  analyzeSpeechWithBackend,
  type AnalyzeApiResponse,
} from "../config/api";
import { addActivity } from "../utils/activityHistory";

type SpeakingMode = "idle" | "recording" | "responding" | "analyzed";
type RepeatMode = "idle" | "recording" | "saved";

type SpeakingResult = {
  spokenText: string;
  correctedSentence: string;
  score: number;
  confidenceScore: number;
  fluencyScore: number;
  speakingScore: number;
  mistakes: string[];
  correction: string;
  simpleExplanation: string;
  mistakeMemory: string[];
  coachReply: string;
  repeatSentence: string;
  usedBackend: boolean;
};

type SuggestedSentence = {
  text: string;
  purpose: string;
  simulatedMistake: string;
};

const ACTION_COLOR = "#8499DC";
const RECORDING_COLOR = "#DC2626";
const DISABLED_COLOR = "#94A3B8";
const AUTO_STOP_MS = 5000;

const suggestedSentences: SuggestedSentence[] = [
  {
    text: "I went to the market.",
    purpose: "Past action",
    simulatedMistake: "I go market",
  },
  {
    text: "I go to school every day.",
    purpose: "Daily routine",
    simulatedMistake: "I go school every day",
  },
  {
    text: "I am learning English.",
    purpose: "Present action",
    simulatedMistake: "I learning English",
  },
  {
    text: "Could you repeat that slowly?",
    purpose: "Real conversation",
    simulatedMistake: "Can you repeat slow",
  },
];

function buildFallbackResult(sentence: SuggestedSentence): SpeakingResult {
  return {
    spokenText: sentence.simulatedMistake,
    correctedSentence: sentence.text,
    score: 72,
    confidenceScore: 70,
    fluencyScore: 66,
    speakingScore: 72,
    mistakes: ["Grammar / sentence structure", "Speaking clarity practice"],
    correction: `Say: ${sentence.text}`,
    simpleExplanation:
      "Local fallback result used. Your sentence was improved into a clearer and more natural version.",
    mistakeMemory: [
      "Practice full sentence structure.",
      "Speak slowly before increasing speed.",
      "Repeat the corrected sentence until it feels natural.",
    ],
    coachReply: `Good try. Now repeat slowly: ${sentence.text}`,
    repeatSentence: sentence.text,
    usedBackend: false,
  };
}

function mapBackendResult(
  sentence: SuggestedSentence,
  apiResult: AnalyzeApiResponse
): SpeakingResult {
  const backendScore =
    typeof apiResult.score === "number" && !Number.isNaN(apiResult.score)
      ? apiResult.score
      : 72;

  const correctedSentence =
    apiResult.correctedText ||
    apiResult.improved ||
    apiResult.repeatSentence ||
    sentence.text;

  const mistakes =
    Array.isArray(apiResult.mistakes) && apiResult.mistakes.length > 0
      ? apiResult.mistakes
      : ["No major mistake found"];

  return {
    spokenText: apiResult.originalText || sentence.simulatedMistake,
    correctedSentence,
    score: backendScore,
    confidenceScore:
      typeof apiResult.confidenceScore === "number"
        ? apiResult.confidenceScore
        : Math.min(backendScore + 2, 100),
    fluencyScore:
      typeof apiResult.fluencyScore === "number"
        ? apiResult.fluencyScore
        : Math.max(backendScore - 4, 0),
    speakingScore:
      typeof apiResult.pronunciationScore === "number"
        ? apiResult.pronunciationScore
        : backendScore,
    mistakes,
    correction:
      apiResult.simpleExplanation || `Say this better: ${correctedSentence}`,
    simpleExplanation:
      apiResult.teacherExplanation ||
      apiResult.simpleExplanation ||
      "The backend checked your sentence and improved it for clearer speaking.",
    mistakeMemory: [
      mistakes.join(", "),
      "Repeat the corrected sentence clearly.",
      "Save this mistake pattern to improve future speaking.",
    ],
    coachReply:
      apiResult.coachReply ||
      apiResult.smartSuggestion ||
      `Good effort. Now repeat slowly: ${correctedSentence}`,
    repeatSentence: apiResult.repeatSentence || correctedSentence,
    usedBackend: true,
  };
}

export default function SpeakingScreen() {
  const [mode, setMode] = useState<SpeakingMode>("idle");
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("idle");
  const [selectedSentence, setSelectedSentence] = useState<SuggestedSentence>(
    suggestedSentences[0]
  );
  const [result, setResult] = useState<SpeakingResult>(
    buildFallbackResult(suggestedSentences[0])
  );
  const [showResultPopup, setShowResultPopup] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStoppingRef = useRef(false);
  const isMountedRef = useRef(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barOne = useRef(new Animated.Value(14)).current;
  const barTwo = useRef(new Animated.Value(30)).current;
  const barThree = useRef(new Animated.Value(18)).current;
  const barFour = useRef(new Animated.Value(34)).current;
  const barFive = useRef(new Animated.Value(22)).current;

  const isListening = mode === "recording" || repeatMode === "recording";

  const clearAutoStopTimer = () => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  };

  const stopActiveRecordingSilently = async () => {
    clearAutoStopTimer();

    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (error) {
        console.log("Silent recording cleanup:", error);
      }

      recordingRef.current = null;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.log("Audio mode cleanup failed:", error);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      Speech.stop();
      void stopActiveRecordingSilently();
    };
  }, []);

  useEffect(() => {
    if (!isListening) {
      pulseAnim.setValue(1);
      barOne.setValue(14);
      barTwo.setValue(30);
      barThree.setValue(18);
      barFour.setValue(34);
      barFive.setValue(22);
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

    const barLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(barOne, {
            toValue: 34,
            duration: 420,
            useNativeDriver: false,
          }),
          Animated.timing(barOne, {
            toValue: 14,
            duration: 420,
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.timing(barTwo, {
            toValue: 16,
            duration: 460,
            useNativeDriver: false,
          }),
          Animated.timing(barTwo, {
            toValue: 34,
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
            toValue: 18,
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
            toValue: 36,
            duration: 500,
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.timing(barFive, {
            toValue: 40,
            duration: 450,
            useNativeDriver: false,
          }),
          Animated.timing(barFive, {
            toValue: 20,
            duration: 450,
            useNativeDriver: false,
          }),
        ]),
      ])
    );

    pulseLoop.start();
    barLoop.start();

    return () => {
      pulseLoop.stop();
      barLoop.stop();
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

  const speakText = (text: string) => {
    if (!text.trim()) return;

    Speech.stop();
    Speech.speak(text, {
      language: "en-US",
      rate: 0.84,
    });
  };

  const saveSpeakingActivity = async (analysis: SpeakingResult) => {
    try {
      await addActivity({
        type: "speaking",
        title: "Speaking practice",
        detail: `Spoke: ${analysis.spokenText} → ${analysis.correctedSentence}`,
        score: analysis.score,
        confidence: analysis.confidenceScore,
        fluency: analysis.fluencyScore,
        mistake: analysis.mistakes.join(", "),
        correctedSentence: analysis.correctedSentence,
      });
    } catch (error) {
      console.log("Failed to save speaking activity:", error);
    }
  };

  const saveRepeatActivity = async () => {
    try {
      await addActivity({
        type: "speaking",
        title: "Speaking repeat practice",
        detail: `Repeated: ${result.repeatSentence}`,
        score: Math.min(result.score + 6, 100),
        confidence: Math.min(result.confidenceScore + 6, 100),
        fluency: Math.min(result.fluencyScore + 6, 100),
        mistake: result.mistakes.join(", "),
        correctedSentence: result.repeatSentence,
      });
    } catch (error) {
      console.log("Failed to save repeat activity:", error);
    }
  };

  const analyzeSpeakingWithBackend = async (audioUri: string) => {
    try {
      const apiResult = await analyzeSpeechWithBackend(
      audioUri,
      selectedSentence.simulatedMistake
      );
      const mappedResult = mapBackendResult(selectedSentence, apiResult);

      if (!isMountedRef.current) return mappedResult;

      setResult(mappedResult);
      await saveSpeakingActivity(mappedResult);
      return mappedResult;
    } catch (error) {
      console.log("Speaking speech backend fallback:", error);

      const fallbackResult = buildFallbackResult(selectedSentence);

      if (!isMountedRef.current) return fallbackResult;

      setResult(fallbackResult);
      await saveSpeakingActivity(fallbackResult);
      return fallbackResult;
    }
  };

  const stopAudioRecordingAndAnalyze = async () => {
    if (isStoppingRef.current) {
      return;
    }

    isStoppingRef.current = true;
    clearAutoStopTimer();

    try {
      const recording = recordingRef.current;

      if (!recording) {
        throw new Error("No active recording found");
      }

      await recording.stopAndUnloadAsync();

      const audioUri = recording.getURI();

      recordingRef.current = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (!audioUri) {
        throw new Error("Recording URI not found");
      }

      if (isMountedRef.current) {
        setMode("responding");
      }

      await analyzeSpeakingWithBackend(audioUri);

      if (isMountedRef.current) {
        setMode("analyzed");
        setShowResultPopup(true);
      }

      isStoppingRef.current = false;
    } catch (error) {
      console.log("Failed to stop/analyze audio:", error);

      recordingRef.current = null;

      if (isMountedRef.current) {
        setMode("responding");
      }

      const fallbackResult = buildFallbackResult(selectedSentence);

      if (isMountedRef.current) {
        setResult(fallbackResult);
        await saveSpeakingActivity(fallbackResult);
        setMode("analyzed");
        setShowResultPopup(true);
      }

      isStoppingRef.current = false;
    }
  };

  const startAudioRecording = async () => {
    try {
      Speech.stop();
      clearAutoStopTimer();
      isStoppingRef.current = false;

      if (recordingRef.current) {
        await stopActiveRecordingSilently();
      }

      const permission = await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Microphone permission needed",
          "Please allow microphone access to practice speaking."
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      });

      const recording = new Audio.Recording();

      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      await recording.startAsync();

      recordingRef.current = recording;

      if (isMountedRef.current) {
        setMode("recording");
      }

      autoStopTimerRef.current = setTimeout(() => {
        void stopAudioRecordingAndAnalyze();
      }, AUTO_STOP_MS);
    } catch (error) {
      console.log("Failed to start audio recording:", error);

      clearAutoStopTimer();
      recordingRef.current = null;

      if (isMountedRef.current) {
        setMode("idle");
      }

      Alert.alert(
        "Recording error",
        "Could not start recording. Please try again."
      );
    }
  };

  const chooseSentence = async (item: SuggestedSentence) => {
    Speech.stop();
    clearAutoStopTimer();
    isStoppingRef.current = false;

    if (recordingRef.current) {
      await stopActiveRecordingSilently();
    }

    setSelectedSentence(item);
    setMode("idle");
    setRepeatMode("idle");
    setShowResultPopup(false);
    setResult(buildFallbackResult(item));
  };

  const handleMainButton = async () => {
    if (mode === "responding") {
      return;
    }

    if (repeatMode === "recording") {
      setRepeatMode("saved");
      await saveRepeatActivity();
      return;
    }

    if (repeatMode === "saved") {
      setRepeatMode("idle");
      setMode("idle");
      return;
    }

    if (mode === "idle") {
      await startAudioRecording();
      return;
    }

    if (mode === "recording") {
      await stopAudioRecordingAndAnalyze();
      return;
    }

    if (mode === "analyzed") {
      setRepeatMode("idle");
      await startAudioRecording();
    }
  };

  const startRepeatFromPopup = () => {
    setShowResultPopup(false);
    setMode("idle");
    setRepeatMode("recording");
  };

  const handleTryAgainFromPopup = async () => {
    setShowResultPopup(false);
    setRepeatMode("idle");
    await startAudioRecording();
  };

  const handleLivePress = () => {
    Alert.alert(
      "Live conversation coming later",
      "Live AI teacher conversation needs real-time speech, backend session handling, and streaming. We will add it after the speaking engine is stable."
    );
  };

  const getMainButtonText = () => {
    if (repeatMode === "recording") return "Save Repeat";
    if (repeatMode === "saved") return "Practice Again";
    if (mode === "recording") return "Stop & Check";
    if (mode === "responding") return "Checking...";
    if (mode === "analyzed") return "Practice Again";
    return "Start Speaking";
  };

  const getMainButtonIcon = (): keyof typeof Ionicons.glyphMap => {
    if (repeatMode === "recording") return "checkmark-outline";
    if (repeatMode === "saved") return "refresh-outline";
    if (mode === "recording") return "stop";
    if (mode === "responding") return "hourglass-outline";
    if (mode === "analyzed") return "refresh-outline";
    return "mic-outline";
  };

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>AI English Coach</Text>
            <Text style={styles.title}>Speaking</Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons name="mic-outline" size={24} color={ACTION_COLOR} />
          </View>
        </View>

        <View style={styles.suggestionCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="chatbubbles-outline"
                size={23}
                color={ACTION_COLOR}
              />
            </View>

            <View style={styles.cardTitleBox}>
              <Text style={styles.cardTitle}>Sentence Suggestions</Text>
              <Text style={styles.cardSubtitle}>
                Choose one sentence, listen first, then speak it aloud.
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sentenceRow}
          >
            {suggestedSentences.map((item) => {
              const active = selectedSentence.text === item.text;

              return (
                <TouchableOpacity
                  key={item.text}
                  style={[
                    styles.sentenceCard,
                    active && styles.sentenceCardActive,
                  ]}
                  onPress={() => chooseSentence(item)}
                  activeOpacity={0.85}
                  disabled={mode === "responding"}
                >
                  <Text
                    style={[
                      styles.sentencePurpose,
                      active && styles.sentencePurposeActive,
                    ]}
                  >
                    {item.purpose}
                  </Text>

                  <Text
                    style={[
                      styles.sentenceText,
                      active && styles.sentenceTextActive,
                    ]}
                  >
                    {item.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.practiceCard}>
          <View style={styles.practiceTopRow}>
            <View style={styles.practiceTextBox}>
              <Text style={styles.practiceLabel}>Practice Sentence</Text>
              <Text style={styles.practiceSentence}>
                {selectedSentence.text}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.listenIconButton}
              onPress={() => speakText(selectedSentence.text)}
              activeOpacity={0.85}
              disabled={mode === "responding"}
            >
              <Ionicons
                name="volume-high-outline"
                size={21}
                color={ACTION_COLOR}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.recordingBox,
              isListening && styles.recordingBoxActive,
              mode === "responding" && styles.respondingBox,
            ]}
          >
            <Animated.View
              style={[
                styles.micCircle,
                isListening && {
                  backgroundColor: RECORDING_COLOR,
                  borderColor: RECORDING_COLOR,
                  transform: [{ scale: pulseAnim }],
                },
                mode === "responding" && styles.respondingMicCircle,
              ]}
            >
              <Ionicons
                name={
                  mode === "responding"
                    ? "hourglass-outline"
                    : isListening
                    ? "radio-button-on"
                    : "mic-outline"
                }
                size={34}
                color={
                  isListening || mode === "responding"
                    ? "#FFFFFF"
                    : ACTION_COLOR
                }
              />
            </Animated.View>

            <View style={styles.waveBox}>
              <Animated.View style={[styles.waveBar, { height: barOne }]} />
              <Animated.View style={[styles.waveBar, { height: barTwo }]} />
              <Animated.View style={[styles.waveBar, { height: barThree }]} />
              <Animated.View style={[styles.waveBar, { height: barFour }]} />
              <Animated.View style={[styles.waveBar, { height: barFive }]} />
            </View>

            <Text style={styles.recordingTitle}>
              {repeatMode === "recording"
                ? "Repeating..."
                : repeatMode === "saved"
                ? "Repeat saved"
                : mode === "idle"
                ? "Ready to speak"
                : mode === "recording"
                ? "Listening..."
                : mode === "responding"
                ? "Responding..."
                : "Result ready"}
            </Text>

            <Text style={styles.recordingText}>
              {repeatMode === "recording"
                ? "Say the corrected sentence again."
                : repeatMode === "saved"
                ? "Your repeat practice was saved to Progress."
                : mode === "idle"
                ? "Tap Start Speaking and say the sentence aloud."
                : mode === "recording"
                ? "Speak now. The app will auto-check after a few seconds."
                : mode === "responding"
                ? "AI is checking your speaking. Please wait..."
                : "Your result is inside the popup."}
            </Text>
          </View>

          {repeatMode === "saved" && (
            <View style={styles.savedBox}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <Text style={styles.savedText}>
                Repeat practice saved to Progress.
              </Text>
            </View>
          )}

          <View style={styles.lowerActionRow}>
            <TouchableOpacity
              style={[
                styles.dynamicActionButton,
                isListening && styles.dynamicActionButtonRecording,
                mode === "responding" && styles.dynamicActionButtonDisabled,
              ]}
              onPress={handleMainButton}
              activeOpacity={0.85}
              disabled={mode === "responding"}
            >
              <Ionicons name={getMainButtonIcon()} size={18} color="#FFFFFF" />
              <Text style={styles.dynamicActionText}>
                {getMainButtonText()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.liveButton,
                mode === "responding" && styles.liveButtonDisabled,
              ]}
              onPress={handleLivePress}
              activeOpacity={0.85}
              disabled={mode === "responding"}
            >
              <Ionicons name="radio-outline" size={18} color="#FFFFFF" />
              <Text style={styles.liveButtonText}>Live</Text>
            </TouchableOpacity>
          </View>

          {mode === "analyzed" && repeatMode !== "recording" && (
            <TouchableOpacity
              style={styles.openResultButton}
              onPress={() => setShowResultPopup(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="expand-outline" size={18} color={ACTION_COLOR} />
              <Text style={styles.openResultButtonText}>
                Open Speaking Result
              </Text>
            </TouchableOpacity>
          )}
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
                  name="sparkles-outline"
                  size={23}
                  color={ACTION_COLOR}
                />
              </View>

              <View style={styles.modalTitleBox}>
                <Text style={styles.modalLabel}>Speaking Result</Text>
                <Text style={styles.modalTitle}>Your coach feedback is ready</Text>
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
              <View style={styles.scoreGrid}>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreValue}>{result.fluencyScore}%</Text>
                  <Text style={styles.scoreLabel}>Fluency</Text>
                </View>

                <View style={styles.scoreBox}>
                  <Text style={styles.scoreValue}>
                    {result.confidenceScore}%
                  </Text>
                  <Text style={styles.scoreLabel}>Confidence</Text>
                </View>

                <View style={styles.scoreBox}>
                  <Text style={styles.scoreValue}>{result.speakingScore}%</Text>
                  <Text style={styles.scoreLabel}>Speaking</Text>
                </View>
              </View>

              {!result.usedBackend && (
                <View style={styles.fallbackNotice}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#92400E"
                  />
                  <Text style={styles.fallbackNoticeText}>
                    Local fallback result used. Backend connection can be tested
                    again after this screen is stable.
                  </Text>
                </View>
              )}

              <View style={styles.userSaidBox}>
                <Text style={styles.userSaidLabel}>You said</Text>
                <Text style={styles.userSaidText}>{result.spokenText}</Text>
              </View>

              <View style={styles.correctBox}>
                <Text style={styles.correctLabel}>Correct sentence</Text>
                <Text style={styles.correctText}>
                  {result.correctedSentence}
                </Text>

                <TouchableOpacity
                  style={styles.modalSmallButton}
                  onPress={() => speakText(result.correctedSentence)}
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

              <View style={styles.modalInfoBox}>
                <View style={styles.modalInfoTopRow}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={22}
                    color={ACTION_COLOR}
                  />
                  <Text style={styles.modalInfoTitle}>Mistakes Found</Text>
                </View>

                {result.mistakes.map((mistake) => (
                  <View key={mistake} style={styles.mistakeRow}>
                    <View style={styles.mistakeDot} />
                    <Text style={styles.mistakeText}>{mistake}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.teacherBox}>
                <View style={styles.modalInfoTopRow}>
                  <MaterialCommunityIcons
                    name="lightbulb-on-outline"
                    size={22}
                    color={ACTION_COLOR}
                  />
                  <Text style={styles.modalInfoTitle}>Correction</Text>
                </View>

                <Text style={styles.modalInfoText}>{result.correction}</Text>
                <Text style={styles.modalInfoText}>
                  {result.simpleExplanation}
                </Text>
              </View>

              <View style={styles.memoryBox}>
                <View style={styles.modalInfoTopRow}>
                  <MaterialCommunityIcons
                    name="brain"
                    size={22}
                    color={ACTION_COLOR}
                  />
                  <Text style={styles.modalInfoTitle}>Mistake Memory</Text>
                </View>

                {result.mistakeMemory.map((item) => (
                  <View key={item} style={styles.memoryRow}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color={ACTION_COLOR}
                    />
                    <Text style={styles.memoryText}>{item}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.coachReplyBox}>
                <Text style={styles.coachReplyTitle}>Coach Reply</Text>
                <Text style={styles.coachReplyText}>{result.coachReply}</Text>
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
                      Repeat the corrected sentence to build real speaking
                      confidence.
                    </Text>
                  </View>
                </View>

                <View style={styles.modalRepeatSentenceBox}>
                  <Text style={styles.modalRepeatSentence}>
                    {result.repeatSentence}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalLightButton}
                onPress={handleTryAgainFromPopup}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh-outline" size={18} color={ACTION_COLOR} />
                <Text style={styles.modalLightButtonText}>Say Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={startRepeatFromPopup}
                activeOpacity={0.85}
              >
                <Ionicons name="mic-outline" size={18} color="#FFFFFF" />
                <Text style={styles.modalPrimaryButtonText}>Repeat</Text>
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

  greeting: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "800",
    marginBottom: 4,
  },

  title: {
    fontSize: 30,
    lineHeight: 36,
    color: "#0F172A",
    fontWeight: "900",
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  suggestionCard: {
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
    marginBottom: 14,
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

  cardTitleBox: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  sentenceRow: {
    gap: 10,
    paddingRight: 10,
  },

  sentenceCard: {
    width: 210,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sentenceCardActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  sentencePurpose: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "900",
    marginBottom: 7,
  },

  sentencePurposeActive: {
    color: ACTION_COLOR,
  },

  sentenceText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#0F172A",
    fontWeight: "900",
  },

  sentenceTextActive: {
    color: ACTION_COLOR,
  },

  practiceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  practiceTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  practiceTextBox: {
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
    fontSize: 21,
    lineHeight: 29,
    color: "#0F172A",
    fontWeight: "900",
  },

  listenIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  recordingBox: {
    marginTop: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },

  recordingBoxActive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },

  respondingBox: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
  },

  micCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  respondingMicCircle: {
    backgroundColor: DISABLED_COLOR,
    borderColor: DISABLED_COLOR,
  },

  waveBox: {
    width: 140,
    height: 44,
    borderRadius: 18,
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
    backgroundColor: RECORDING_COLOR,
  },

  recordingTitle: {
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 5,
  },

  recordingText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    fontWeight: "700",
    textAlign: "center",
  },

  savedBox: {
    marginTop: 13,
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    flexDirection: "row",
    alignItems: "center",
  },

  savedText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#166534",
    fontWeight: "800",
  },

  lowerActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    alignItems: "center",
  },

  dynamicActionButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  dynamicActionButtonRecording: {
    backgroundColor: RECORDING_COLOR,
  },

  dynamicActionButtonDisabled: {
    backgroundColor: DISABLED_COLOR,
  },

  dynamicActionText: {
    marginLeft: 7,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  liveButton: {
    width: 96,
    height: 48,
    borderRadius: 16,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  liveButtonDisabled: {
    backgroundColor: DISABLED_COLOR,
  },

  liveButtonText: {
    marginLeft: 6,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  openResultButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  openResultButtonText: {
    marginLeft: 7,
    color: ACTION_COLOR,
    fontSize: 13,
    fontWeight: "900",
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
    fontSize: 18,
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
    fontSize: 18,
    color: ACTION_COLOR,
    fontWeight: "900",
    marginBottom: 4,
  },

  scoreLabel: {
    fontSize: 11,
    color: "#334155",
    fontWeight: "900",
  },

  fallbackNotice: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 11,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  fallbackNoticeText: {
    flex: 1,
    marginLeft: 7,
    fontSize: 12,
    lineHeight: 18,
    color: "#92400E",
    fontWeight: "800",
  },

  userSaidBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 12,
  },

  userSaidLabel: {
    fontSize: 12,
    color: "#991B1B",
    fontWeight: "900",
    marginBottom: 5,
  },

  userSaidText: {
    fontSize: 17,
    lineHeight: 24,
    color: "#991B1B",
    fontWeight: "900",
  },

  correctBox: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 12,
  },

  correctLabel: {
    fontSize: 12,
    color: "#166534",
    fontWeight: "900",
    marginBottom: 5,
  },

  correctText: {
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

  modalInfoBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },

  modalInfoTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  modalInfoTitle: {
    marginLeft: 7,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
  },

  modalInfoText: {
    fontSize: 13,
    lineHeight: 21,
    color: "#334155",
    fontWeight: "700",
    marginBottom: 7,
  },

  mistakeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  mistakeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ACTION_COLOR,
    marginRight: 8,
  },

  mistakeText: {
    flex: 1,
    fontSize: 13,
    color: "#334155",
    fontWeight: "800",
  },

  teacherBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    marginBottom: 12,
  },

  memoryBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },

  memoryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },

  memoryText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#334155",
    fontWeight: "700",
  },

  coachReplyBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    marginBottom: 12,
  },

  coachReplyTitle: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 6,
  },

  coachReplyText: {
    fontSize: 13,
    lineHeight: 21,
    color: "#334155",
    fontWeight: "700",
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