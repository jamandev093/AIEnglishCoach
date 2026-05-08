import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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

import { addActivity } from "../utils/activityHistory";

type SpeakingMode = "idle" | "recording" | "analyzed";
type RepeatMode = "idle" | "recording" | "saved";

type SpeakingResult = {
  spokenText: string;
  correctedSentence: string;
  score: number;
  pronunciationScore: number;
  fluencyScore: number;
  repeatAccuracy: number;
  mistakes: string[];
  correction: string;
  simpleExplanation: string;
  mistakeMemory: string[];
  coachReply: string;
};

type SuggestedSentence = {
  text: string;
  purpose: string;
};

const ACTION_COLOR = "#8499DC";

const suggestedSentences: SuggestedSentence[] = [
  {
    text: "I went to the market.",
    purpose: "Past action",
  },
  {
    text: "I go to school every day.",
    purpose: "Daily routine",
  },
  {
    text: "I am learning English.",
    purpose: "Present action",
  },
  {
    text: "Could you repeat that slowly?",
    purpose: "Real conversation",
  },
];

const demoResult: SpeakingResult = {
  spokenText: "I go market",
  correctedSentence: "I went to the market.",
  score: 72,
  pronunciationScore: 68,
  fluencyScore: 66,
  repeatAccuracy: 70,
  mistakes: ["Past tense", "Missing “to”", "Missing “the”"],
  correction: "Say: I went to the market.",
  simpleExplanation:
    "You are talking about a past action, so use “went”. We also say “go to a place”, so “to” is needed before “market”.",
  mistakeMemory: [
    "You often miss “to” before places.",
    "Past tense needs more practice.",
    "Use “the” before a specific place.",
  ],
  coachReply:
    "Good try. Now repeat the corrected sentence slowly: I went to the market.",
};

export default function SpeakingScreen() {
  const [mode, setMode] = useState<SpeakingMode>("idle");
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("idle");
  const [selectedSentence, setSelectedSentence] = useState<SuggestedSentence>(
    suggestedSentences[0]
  );
  const [result, setResult] = useState<SpeakingResult>(demoResult);
  const [showResultPopup, setShowResultPopup] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barOne = useRef(new Animated.Value(14)).current;
  const barTwo = useRef(new Animated.Value(30)).current;
  const barThree = useRef(new Animated.Value(18)).current;
  const barFour = useRef(new Animated.Value(34)).current;
  const barFive = useRef(new Animated.Value(22)).current;

  const isListening = mode === "recording" || repeatMode === "recording";

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
        confidence: 64,
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
        detail: `Repeated: ${result.correctedSentence}`,
        score: result.repeatAccuracy,
        confidence: 70,
        fluency: result.fluencyScore,
        correctedSentence: result.correctedSentence,
      });
    } catch (error) {
      console.log("Failed to save repeat activity:", error);
    }
  };

  const handleMainButton = async () => {
    if (mode === "idle") {
      setRepeatMode("idle");
      setMode("recording");
      return;
    }

    if (mode === "recording") {
      setMode("analyzed");
      setResult(demoResult);
      setShowResultPopup(true);
      await saveSpeakingActivity(demoResult);
      return;
    }

    setRepeatMode("idle");
    setMode("recording");
  };

  const handleRepeatButton = async () => {
    setShowResultPopup(false);
    setMode("idle");
    setRepeatMode("recording");
  };

  const handleStopRepeat = async () => {
    if (repeatMode === "recording") {
      setRepeatMode("saved");
      await saveRepeatActivity();
      return;
    }

    setRepeatMode("recording");
  };

  const handleTryAgainFromPopup = () => {
    setShowResultPopup(false);
    setRepeatMode("idle");
    setMode("recording");
  };

  const handleLivePress = () => {
    Alert.alert(
      "Live conversation coming later",
      "Gemini Live-style conversation needs backend streaming, real-time speech, and AI session handling. We will add this after the speaking engine is stable."
    );
  };

  const dynamicButtonText =
  repeatMode === "recording"
    ? "Recording..."
    : repeatMode === "saved"
    ? "Repeat Again"
    : mode === "recording"
    ? "Recording..."
    : "Practice Again";

const dynamicButtonIcon =
  repeatMode === "recording"
    ? "radio-button-on-outline"
    : repeatMode === "saved"
    ? "refresh-outline"
    : mode === "recording"
    ? "radio-button-on-outline"
    : mode === "analyzed"
    ? "refresh-outline"
    : "mic-outline";

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>AI English Coach</Text>
            <Text style={styles.title}>Speaking</Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons name="mic-outline" size={24} color={ACTION_COLOR} />
          </View>
        </View>

        {/* Sentence Suggestions - replaces Real Speaking Coach card */}
        <View style={styles.suggestionCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardIcon}>
              <Ionicons name="chatbubbles-outline" size={23} color={ACTION_COLOR} />
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
                  onPress={() => {
                    setSelectedSentence(item);
                    setMode("idle");
                    setRepeatMode("idle");
                  }}
                  activeOpacity={0.85}
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

        {/* Practice Sentence Card */}
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
            ]}
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
                size={34}
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

            <Text style={styles.recordingTitle}>
              {repeatMode === "recording"
                ? "Repeating..."
                : repeatMode === "saved"
                ? "Repeat saved"
                : mode === "idle"
                ? "Ready to speak"
                : mode === "recording"
                ? "Listening..."
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
                ? "Speak slowly. Mistakes are okay."
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
      (mode === "recording" || repeatMode === "recording") &&
        styles.dynamicActionButtonRecording,
    ]}
    onPress={
      repeatMode === "recording" || repeatMode === "saved"
        ? handleStopRepeat
        : handleMainButton
    }
    activeOpacity={0.85}
  >
    <Ionicons
      name={dynamicButtonIcon as any}
      size={18}
      color="#FFFFFF"
    />
    <Text style={styles.dynamicActionText}>{dynamicButtonText}</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.liveButton}
    onPress={handleLivePress}
    activeOpacity={0.85}
  >
    <Ionicons name="radio-outline" size={18} color="#FFFFFF" />
    <Text style={styles.liveButtonText}>Live</Text>
  </TouchableOpacity>
</View>

          {mode === "analyzed" && (
            <TouchableOpacity
              style={styles.openResultButton}
              onPress={() => setShowResultPopup(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="expand-outline" size={18} color={ACTION_COLOR} />
              <Text style={styles.openResultButtonText}>Open Speaking Result</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Backend Upgrade Card */}
        <View style={styles.futureCard}>
          <View style={styles.futureHeaderRow}>
            <View style={styles.futureIcon}>
              <Ionicons name="server-outline" size={22} color={ACTION_COLOR} />
            </View>

            <View style={styles.futureTitleBox}>
              <Text style={styles.futureTitle}>Backend Upgrades Later</Text>
              <Text style={styles.futureSubtitle}>
                These need real backend work, so we keep them planned but not
                distracting on the main screen.
              </Text>
            </View>
          </View>

          {[
            "Real microphone upload",
            "Speech-to-text analysis",
            "Pronunciation scoring",
            "Fluency scoring",
            "Repeat accuracy",
            "Live conversation session",
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

      {/* Speaking Result Popup */}
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
                <Ionicons name="sparkles-outline" size={23} color={ACTION_COLOR} />
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
              {/* Score Summary */}
              <View style={styles.scoreSummaryBox}>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreCircleValue}>{result.score}%</Text>
                  <Text style={styles.scoreCircleLabel}>Total</Text>
                </View>

                <View style={styles.scoreDetailsBox}>
                  <ScoreRow label="Pronunciation" value={result.pronunciationScore} />
                  <ScoreRow label="Fluency" value={result.fluencyScore} />
                  <ScoreRow label="Repeat Accuracy" value={result.repeatAccuracy} />
                </View>
              </View>

              {/* User Said */}
              <View style={styles.userSaidBox}>
                <Text style={styles.userSaidLabel}>You said</Text>
                <Text style={styles.userSaidText}>{result.spokenText}</Text>
              </View>

              {/* Correction */}
              <View style={styles.correctBox}>
                <Text style={styles.correctLabel}>Correct sentence</Text>
                <Text style={styles.correctText}>{result.correctedSentence}</Text>

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

              {/* Mistakes */}
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

              {/* Explanation */}
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

              {/* Mistake Memory */}
              <View style={styles.memoryBox}>
                <View style={styles.modalInfoTopRow}>
                  <Ionicons name="brain-outline" size={22} color={ACTION_COLOR} />
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

              {/* Coach Reply */}
              <View style={styles.coachReplyBox}>
                <Text style={styles.coachReplyTitle}>Coach Reply</Text>
                <Text style={styles.coachReplyText}>{result.coachReply}</Text>
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
                onPress={handleRepeatButton}
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

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreRowLabel}>{label}</Text>
      <Text style={styles.scoreRowValue}>{value}%</Text>
    </View>
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
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
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
    backgroundColor: ACTION_COLOR,
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
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 8,
  },

  lowerActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  smallActionButton: {
    flex: 1,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  smallActionText: {
    marginLeft: 6,
    color: ACTION_COLOR,
    fontSize: 13,
    fontWeight: "900",
  },

  liveButton: {
    width: 96,
    height: 44,
    borderRadius: 15,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  liveButtonText: {
    marginLeft: 6,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
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
  backgroundColor: "#f30606",
},

dynamicActionText: {
  marginLeft: 7,
  color: "#FFFFFF",
  fontSize: 14,
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
    fontSize: 17,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 5,
  },

  futureSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
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

  scoreSummaryBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    flexDirection: "row",
    marginBottom: 12,
  },

  scoreCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  scoreCircleValue: {
    fontSize: 22,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  scoreCircleLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "900",
    marginTop: 2,
  },

  scoreDetailsBox: {
    flex: 1,
    justifyContent: "center",
  },

  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },

  scoreRowLabel: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "800",
  },

  scoreRowValue: {
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
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
    marginBottom: 4,
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