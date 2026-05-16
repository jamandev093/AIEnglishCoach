import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  analyzeSentenceWithBackend,
  getConfidenceVideosContent,
  type AnalyzeApiResponse,
  type ContentItem,
} from "../src/config/api";
import PremiumLockedModal from "../src/components/PremiumLockedModal";
import {
  DEFAULT_LOCAL_USER_ACCESS,
  canAccessContent,
} from "../src/utils/accessControl";
import { addActivity } from "../src/utils/activityHistory";

type MissionState = "idle" | "watching" | "ready" | "recording" | "completed";
type RepeatState = "idle" | "recording" | "saved";

type ConfidenceMission = {
  id: string;
  title: string;
  situation: string;
  emotion: string;
  accent: string;
  level: string;
  videoLength: string;
  videoEmoji: string;
  videoScene: string;
  prompt: string;
  sentenceStarters: string[];
  expectedResponse: string;
  userSample: string;
  betterResponse: string;
  mistake: string;
  coachTip: string;
};

type ConfidenceResult = {
  originalText: string;
  correctedText: string;
  score: number;
  confidenceScore: number;
  fluencyScore: number;
  responseScore: number;
  mistakes: string[];
  simpleExplanation: string;
  teacherExplanation: string;
  smartSuggestion: string;
  repeatSentence: string;
  coachReply: string;
  usedBackend: boolean;
};

const ACTION_COLOR = "#8499DC";
const RECORDING_COLOR = "#DC2626";

const missions: ConfidenceMission[] = [
  {
    id: "market-buying",
    title: "Buying in Market",
    situation: "A shopkeeper is talking to you in a market.",
    emotion: "Polite",
    accent: "Indian English",
    level: "Beginner",
    videoLength: "10 sec",
    videoEmoji: "🛒",
    videoScene: "A shopkeeper looks at you and asks what you want to buy.",
    prompt: "Speak what you are seeing in the video in a simple confident way.",
    sentenceStarters: [
      "In this video...",
      "The shopkeeper is...",
      "I can see...",
    ],
    expectedResponse:
      "In this video, a shopkeeper is asking what I want to buy.",
    userSample: "A shopkeeper asking what I want buy.",
    betterResponse:
      "In this video, a shopkeeper is asking what I want to buy.",
    mistake: "Missing helping verb “is” and missing “to” after want.",
    coachTip:
      "Good try. Describe the scene in a full sentence and speak slowly.",
  },
  {
    id: "office-idea",
    title: "Office Discussion",
    situation: "A colleague is asking about your idea in an office.",
    emotion: "Professional",
    accent: "Neutral English",
    level: "Intermediate",
    videoLength: "10 sec",
    videoEmoji: "💼",
    videoScene: "A colleague asks you to explain your idea in simple words.",
    prompt: "Speak what you are seeing in the video clearly and confidently.",
    sentenceStarters: [
      "In this video...",
      "My colleague is...",
      "The person is asking...",
    ],
    expectedResponse:
      "In this video, my colleague is asking me to explain my idea.",
    userSample: "My colleague asking me explain my idea.",
    betterResponse:
      "In this video, my colleague is asking me to explain my idea.",
    mistake: "Missing helping verb “is” and missing “to” before explain.",
    coachTip:
      "Very good. Use a complete sentence to describe the office situation.",
  },
  {
    id: "teacher-absence",
    title: "Talking to Teacher",
    situation: "A teacher is asking about your absence.",
    emotion: "Respectful",
    accent: "Indian English",
    level: "Beginner",
    videoLength: "10 sec",
    videoEmoji: "👩‍🏫",
    videoScene: "A teacher asks why you were absent yesterday.",
    prompt: "Speak what you are seeing in the video in a respectful way.",
    sentenceStarters: [
      "In this video...",
      "The teacher is...",
      "She is asking...",
    ],
    expectedResponse:
      "In this video, the teacher is asking why I was absent yesterday.",
    userSample: "Teacher asking why I absent yesterday.",
    betterResponse:
      "In this video, the teacher is asking why I was absent yesterday.",
    mistake:
      "Missing article “the”, helping verb “was”, and helping verb “is”.",
    coachTip:
      "Good effort. Use full sentence structure when describing the situation.",
  },
];


function formatContentLevel(level: ContentItem["level"]): string {
  if (level === "advanced") return "Advanced";
  if (level === "intermediate") return "Intermediate";
  return "Beginner";
}

function getConfidenceEmoji(category: string): string {
  const normalizedCategory = category.toLowerCase();

  if (normalizedCategory.includes("shop")) return "??";
  if (normalizedCategory.includes("school")) return "?????";
  if (normalizedCategory.includes("office")) return "??";
  if (normalizedCategory.includes("health")) return "??";
  if (normalizedCategory.includes("travel")) return "??";

  return "??";
}

function buildMissionFromContent(item: ContentItem): ConfidenceMission {
  const expectedResponse =
    item.expectedResponse ||
    "I can speak clearly and confidently in this situation.";

  return {
    id: item.id,
    title: item.title || "Confidence Mission",
    situation: item.prompt || "A real-life speaking situation.",
    emotion: "Confident",
    accent: "AI Coach",
    level: formatContentLevel(item.level),
    videoLength: "10 sec",
    videoEmoji: getConfidenceEmoji(item.category),
    videoScene:
      item.prompt ||
      "Watch the short situation and describe what is happening.",
    prompt:
      item.prompt ||
      "Speak what you are seeing in the video in a confident way.",
    sentenceStarters:
      item.sentenceStarters.length > 0
        ? item.sentenceStarters
        : ["In this video...", "I can see...", "The person is..."],
    expectedResponse,
    userSample: expectedResponse,
    betterResponse: expectedResponse,
    mistake:
      "The app will check your grammar, small missing words, and confidence after you speak.",
    coachTip:
      "Good effort. Speak in a full sentence, keep your voice clear, and repeat the improved response.",
  };
}

function buildMissionsFromContent(items: ContentItem[]): ConfidenceMission[] {
  const backendMissions = items.map(buildMissionFromContent);

  return backendMissions.length > 0 ? backendMissions : missions;
}

function buildFallbackResult(
  mission: ConfidenceMission,
  spokenText: string
): ConfidenceResult {
  return {
    originalText: spokenText,
    correctedText: mission.betterResponse,
    score: 74,
    confidenceScore: 72,
    fluencyScore: 68,
    responseScore: 70,
    mistakes: [mission.mistake],
    simpleExplanation: mission.mistake,
    teacherExplanation:
      "Use a full sentence when describing a real-life situation. Add the missing helping verb and use the correct small words.",
    smartSuggestion: mission.coachTip,
    repeatSentence: mission.betterResponse,
    coachReply: mission.coachTip,
    usedBackend: false,
  };
}

function mapBackendResult(
  mission: ConfidenceMission,
  spokenText: string,
  result: AnalyzeApiResponse
): ConfidenceResult {
  const correctedText =
    result.correctedText ||
    result.improved ||
    result.repeatSentence ||
    mission.betterResponse;

  const backendScore =
    typeof result.score === "number" && !Number.isNaN(result.score)
      ? result.score
      : 74;

  return {
    originalText: result.originalText || spokenText,
    correctedText,
    score: backendScore,
    confidenceScore:
      typeof result.confidenceScore === "number"
        ? result.confidenceScore
        : Math.min(100, backendScore + 2),
    fluencyScore:
      typeof result.fluencyScore === "number"
        ? result.fluencyScore
        : Math.max(0, backendScore - 4),
    responseScore:
      typeof result.pronunciationScore === "number"
        ? result.pronunciationScore
        : backendScore,
    mistakes:
      Array.isArray(result.mistakes) && result.mistakes.length > 0
        ? result.mistakes
        : [mission.mistake],
    simpleExplanation:
      result.simpleExplanation ||
      "The AI improved your sentence so it sounds more natural.",
    teacherExplanation:
      result.teacherExplanation ||
      "Use a complete sentence and add the missing small words.",
    smartSuggestion:
      result.smartSuggestion ||
      "Repeat the corrected sentence slowly and clearly.",
    repeatSentence: result.repeatSentence || correctedText,
    coachReply:
      result.coachReply ||
      result.smartSuggestion ||
      "Good effort. Now repeat the better sentence with confidence.",
    usedBackend: true,
  };
}

export default function ConfidenceBuildingScreen() {
  const [missionList, setMissionList] = useState<ConfidenceMission[]>(missions);
  const [selectedMission, setSelectedMission] = useState<ConfidenceMission>(
    missions[0]
  );
  const [missionsLoading, setMissionsLoading] = useState(false);
  const [missionsError, setMissionsError] = useState<string | null>(null);
  const [missionState, setMissionState] = useState<MissionState>("idle");
  const [repeatState, setRepeatState] = useState<RepeatState>("idle");
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [premiumModalTitle, setPremiumModalTitle] = useState(
    "AI Confidence Feedback is Premium"
  );
  const [premiumModalMessage, setPremiumModalMessage] = useState(
    "AI response analysis, confidence scoring, and improvement coaching are premium features. Payment and account access will be added soon. Continue free confidence practice for now."
  );
  const [userAnswer, setUserAnswer] = useState("");
  const [resultData, setResultData] = useState<ConfidenceResult | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barOne = useRef(new Animated.Value(12)).current;
  const barTwo = useRef(new Animated.Value(26)).current;
  const barThree = useRef(new Animated.Value(16)).current;
  const barFour = useRef(new Animated.Value(31)).current;

  const isRecording =
    missionState === "recording" || repeatState === "recording";

  useFocusEffect(
    useCallback(() => {
      setMissionState("idle");
      setRepeatState("idle");
      setShowResultPopup(false);
      setUserAnswer("");
      setResultData(null);
      Speech.stop();
    }, [])
  );


  useEffect(() => {
    let isMounted = true;

    const loadConfidenceMissions = async () => {
      try {
        setMissionsLoading(true);
        setMissionsError(null);

        const response = await getConfidenceVideosContent();
        const backendMissions = buildMissionsFromContent(response.items);

        if (!isMounted) return;

        setMissionList(backendMissions);
        setSelectedMission(backendMissions[0]);
        setUserAnswer("");
        setResultData(null);
      } catch (error) {
        console.log("Confidence content fallback:", error);

        if (!isMounted) return;

        setMissionList(missions);
        setSelectedMission(missions[0]);
        setUserAnswer("");
        setResultData(null);
        setMissionsError(
          "Using saved confidence missions while backend content loads."
        );
      } finally {
        if (isMounted) {
          setMissionsLoading(false);
        }
      }
    };

    loadConfidenceMissions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isRecording) {
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
  }, [isRecording, pulseAnim, barOne, barTwo, barThree, barFour]);

  const speakText = (text: string) => {
    if (!text.trim()) return;

    Speech.stop();
    Speech.speak(text, {
      language: "en-US",
      rate: 0.84,
    });
  };

  const chooseMission = (mission: ConfidenceMission) => {
    Speech.stop();
    setSelectedMission(mission);
    setMissionState("idle");
    setRepeatState("idle");
    setShowResultPopup(false);
    setUserAnswer("");
    setResultData(null);
  };

  const watchVideoMission = () => {
    setMissionState("watching");

    setTimeout(() => {
      setMissionState("ready");
    }, 1200);
  };

  const analyzeConfidenceAnswer = async (spokenText: string) => {
    try {
      const backendResult = await analyzeSentenceWithBackend(spokenText);
      return mapBackendResult(selectedMission, spokenText, backendResult);
    } catch {
      return buildFallbackResult(selectedMission, spokenText);
    }
  };

  const saveConfidenceActivity = async (result: ConfidenceResult) => {
    await addActivity({
      type: "confidence",
      title: selectedMission.title,
      detail: `Confidence mission: ${result.originalText}`,
      score: result.score,
      confidence: result.confidenceScore,
      fluency: result.fluencyScore,
      mistake: result.mistakes.join(", "),
      correctedSentence: result.correctedText,
    });
  };

  const handleMainAction = async () => {
    if (repeatState === "recording") {
      const repeatSentence =
        resultData?.repeatSentence || selectedMission.betterResponse;

      setRepeatState("saved");

      await addActivity({
        type: "confidence",
        title: "Confidence repeat practice",
        detail: `Repeated: ${repeatSentence}`,
        score: 82,
        confidence: 76,
        fluency: 70,
        mistake:
          resultData?.mistakes.join(", ") || selectedMission.mistake,
        correctedSentence: repeatSentence,
      });

      return;
    }

    if (repeatState === "saved") {
      setRepeatState("idle");
      setMissionState("idle");
      setUserAnswer("");
      setResultData(null);
      return;
    }

    if (missionState === "watching") {
      return;
    }

    if (missionState === "idle" || missionState === "ready") {
      setMissionState("recording");
      return;
    }

    if (missionState === "recording") {
      const accessDecision = canAccessContent(
        {
          isPremium: true,
          title: "AI Confidence Feedback",
        },
        DEFAULT_LOCAL_USER_ACCESS
      );

      if (!accessDecision.allowed) {
        setMissionState("idle");
        setPremiumModalTitle("AI Confidence Feedback is Premium");
        setPremiumModalMessage(
          "AI response analysis, confidence scoring, and improvement coaching are premium features. Payment and account access will be added soon. Continue free confidence practice for now."
        );
        setPremiumModalVisible(true);
        return;
      }

      const simulatedAnswer = selectedMission.userSample;

      setUserAnswer(simulatedAnswer);

      const analyzedResult = await analyzeConfidenceAnswer(simulatedAnswer);

      setResultData(analyzedResult);
      setMissionState("completed");
      setShowResultPopup(true);

      await saveConfidenceActivity(analyzedResult);

      return;
    }

    if (missionState === "completed") {
      setRepeatState("recording");
      setMissionState("idle");
    }
  };

  const startRepeatFromPopup = () => {
    setShowResultPopup(false);
    setMissionState("idle");
    setRepeatState("recording");
  };

  const resetMission = () => {
    Speech.stop();
    setMissionState("idle");
    setRepeatState("idle");
    setShowResultPopup(false);
    setUserAnswer("");
    setResultData(null);
  };

  const openLiveMode = () => {
    Alert.alert(
      "Live Confidence Coming Soon",
      "Later this will start a live AI confidence conversation. For MVP, use the 10-second mission flow."
    );
  };

  const getMainButtonText = () => {
    if (repeatState === "recording") return "Save Repeat";
    if (repeatState === "saved") return "Practice Again";
    if (missionState === "watching") return "Watching...";
    if (missionState === "recording") return "Stop & Check";
    if (missionState === "completed") return "Repeat";
    return "Start";
  };

  const getMainButtonIcon = (): keyof typeof Ionicons.glyphMap => {
    if (repeatState === "recording") return "checkmark-outline";
    if (repeatState === "saved") return "refresh-outline";
    if (missionState === "watching") return "hourglass-outline";
    if (missionState === "recording") return "stop";
    if (missionState === "completed") return "repeat-outline";
    return "mic-outline";
  };

  const popupResult =
    resultData || buildFallbackResult(selectedMission, userAnswer);

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

          <Text style={styles.headerTitle}>Build Confidence</Text>

          <View style={styles.emptyBox} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>10-Second Missions</Text>
        </View>

        {missionsLoading && (
          <Text style={styles.contentStatusText}>
            Loading confidence missions from backend...
          </Text>
        )}

        {missionsError && (
          <Text style={styles.contentStatusText}>{missionsError}</Text>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.missionRow}
        >
          {missionList.map((mission) => {
            const active = selectedMission.id === mission.id;

            return (
              <TouchableOpacity
                key={mission.id}
                style={[
                  styles.missionCard,
                  active && styles.missionCardActive,
                ]}
                onPress={() => chooseMission(mission)}
                activeOpacity={0.85}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.missionTitle,
                    active && styles.missionTitleActive,
                  ]}
                >
                  {mission.title}
                </Text>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.missionMeta,
                    active && styles.missionMetaActive,
                  ]}
                >
                  {mission.accent} • {mission.videoLength}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.videoMissionCard}>
          <View style={styles.videoTopRow}>
            <View style={styles.videoTitleBox}>
              <Text style={styles.videoLabel}>Confidence Building</Text>
              <Text style={styles.videoTitle}>{selectedMission.title}</Text>
            </View>

            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {selectedMission.videoLength}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.videoBox}
            onPress={watchVideoMission}
            activeOpacity={0.9}
          >
            <Text style={styles.videoEmoji}>
              {selectedMission.videoEmoji}
            </Text>
            <Text style={styles.videoScene}>
              {selectedMission.videoScene}
            </Text>

            <View style={styles.videoOverlay}>
              <Ionicons
                name={
                  missionState === "watching"
                    ? "hourglass-outline"
                    : missionState === "ready"
                    ? "checkmark-circle-outline"
                    : "play-circle-outline"
                }
                size={38}
                color="#FFFFFF"
              />

              <Text style={styles.videoOverlayText}>
                {missionState === "watching"
                  ? "Watching..."
                  : missionState === "ready"
                  ? "Video watched"
                  : "Tap thumbnail to watch"}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.contextGrid}>
            <View style={styles.contextBox}>
              <Text style={styles.contextLabel}>Situation</Text>
              <Text style={styles.contextText}>
                {selectedMission.situation}
              </Text>
            </View>

            <View style={styles.contextBox}>
              <Text style={styles.contextLabel}>Accent</Text>
              <Text style={styles.contextText}>
                {selectedMission.accent}
              </Text>
            </View>
          </View>

          <Text style={styles.blockHeading}>Speak what you see:</Text>
          <Text style={styles.promptText}>{selectedMission.prompt}</Text>

          <Text style={styles.blockHeading}>Sentence starters:</Text>
          <View style={styles.chipWrap}>
            {selectedMission.sentenceStarters.map((starter) => (
              <View key={starter} style={styles.starterChip}>
                <Text style={styles.starterChipText}>{starter}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.speakCard}>
          <View style={styles.speakTopRow}>
            <View style={styles.speakTextBox}>
              <Text style={styles.speakTitle}>Speak with Confidence</Text>
              <Text style={styles.speakText}>
                Watch the 10-second situation, then speak what you are seeing in
                the video.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.liveButton}
              onPress={openLiveMode}
              activeOpacity={0.85}
            >
              <Ionicons name="radio-outline" size={17} color={ACTION_COLOR} />
              <Text style={styles.liveButtonText}>Live</Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.recordBox,
              isRecording && styles.recordBoxActive,
            ]}
          >
            <Animated.View
              style={[
                styles.micCircle,
                isRecording && {
                  backgroundColor: RECORDING_COLOR,
                  borderColor: RECORDING_COLOR,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Ionicons
                name={isRecording ? "radio-button-on" : "mic-outline"}
                size={26}
                color={isRecording ? "#FFFFFF" : ACTION_COLOR}
              />
            </Animated.View>

            <View style={styles.recordContentRight}>
              <View style={styles.waveBox}>
                <Animated.View style={[styles.waveBar, { height: barOne }]} />
                <Animated.View style={[styles.waveBar, { height: barTwo }]} />
                <Animated.View
                  style={[styles.waveBar, { height: barThree }]}
                />
                <Animated.View style={[styles.waveBar, { height: barFour }]} />
              </View>

              <Text style={styles.recordStatusTitle}>
                {isRecording
                  ? "Recording..."
                  : repeatState === "saved"
                  ? "Repeat saved"
                  : missionState === "watching"
                  ? "Watching video..."
                  : missionState === "ready"
                  ? "Ready to speak"
                  : missionState === "completed"
                  ? "Result ready"
                  : "Ready"}
              </Text>

              <Text style={styles.recordStatusText}>
                {isRecording
                  ? "Speak slowly and describe the video clearly."
                  : repeatState === "saved"
                  ? "Your repeat practice was saved to Progress."
                  : missionState === "watching"
                  ? "Watch the video carefully and notice the situation."
                  : missionState === "ready"
                  ? "Tap Start and speak what you are seeing."
                  : missionState === "completed"
                  ? "Tap Repeat to practice the AI-corrected response."
                  : "Tap Watch first, then describe the video."}
              </Text>
            </View>
          </View>

          {repeatState === "saved" && (
            <View style={styles.savedBox}>
              <Ionicons name="checkmark-circle" size={21} color="#16A34A" />
              <Text style={styles.savedText}>
                Confidence repeat saved to Progress.
              </Text>
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetMission}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh-outline" size={18} color="#334155" />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                isRecording && styles.primaryButtonRecording,
              ]}
              onPress={handleMainAction}
              activeOpacity={0.85}
            >
              <Ionicons name={getMainButtonIcon()} size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {getMainButtonText()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <PremiumLockedModal
        visible={premiumModalVisible}
        title={premiumModalTitle}
        message={premiumModalMessage}
        onClose={() => setPremiumModalVisible(false)}
      />

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
                <Text style={styles.modalLabel}>Confidence Result</Text>
                <Text style={styles.modalTitle}>AI checked your response</Text>
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
                <View style={styles.scoreMiniBox}>
                  <Text style={styles.scoreValue}>
                    {popupResult.confidenceScore}%
                  </Text>
                  <Text style={styles.scoreLabel}>Confidence</Text>
                </View>

                <View style={styles.scoreMiniBox}>
                  <Text style={styles.scoreValue}>
                    {popupResult.fluencyScore}%
                  </Text>
                  <Text style={styles.scoreLabel}>Fluency</Text>
                </View>

                <View style={styles.scoreMiniBox}>
                  <Text style={styles.scoreValue}>
                    {popupResult.score}%
                  </Text>
                  <Text style={styles.scoreLabel}>Response</Text>
                </View>
              </View>

              {!popupResult.usedBackend && (
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

              <View style={styles.userAnswerBox}>
                <Text style={styles.userAnswerLabel}>Your response</Text>
                <Text style={styles.userAnswerText}>
                  {popupResult.originalText}
                </Text>
              </View>

              <View style={styles.correctBox}>
                <Text style={styles.correctLabel}>AI better response</Text>
                <Text style={styles.correctText}>
                  {popupResult.correctedText}
                </Text>

                <TouchableOpacity
                  style={styles.modalSmallButton}
                  onPress={() => speakText(popupResult.correctedText)}
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
                  <Text style={styles.modalInfoTitle}>Mistakes found</Text>
                </View>

                {popupResult.mistakes.map((mistake) => (
                  <Text key={mistake} style={styles.modalInfoText}>
                    • {mistake}
                  </Text>
                ))}
              </View>

              <View style={styles.coachBox}>
                <View style={styles.modalInfoTopRow}>
                  <MaterialCommunityIcons
                    name="robot-happy-outline"
                    size={22}
                    color={ACTION_COLOR}
                  />
                  <Text style={styles.modalInfoTitle}>AI response</Text>
                </View>

                <Text style={styles.modalInfoText}>
                  {popupResult.coachReply}
                </Text>
              </View>

              <View style={styles.modalInfoBox}>
                <View style={styles.modalInfoTopRow}>
                  <Ionicons
                    name="school-outline"
                    size={22}
                    color={ACTION_COLOR}
                  />
                  <Text style={styles.modalInfoTitle}>Teacher explanation</Text>
                </View>

                <Text style={styles.modalInfoText}>
                  {popupResult.teacherExplanation}
                </Text>
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
                      Repeat the AI-corrected response to build real speaking
                      confidence.
                    </Text>
                  </View>
                </View>

                <View style={styles.modalRepeatSentenceBox}>
                  <Text style={styles.modalRepeatSentence}>
                    {popupResult.repeatSentence}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalLightButton}
                onPress={() => speakText(popupResult.repeatSentence)}
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
    marginBottom: 14,
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
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },

  contentStatusText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "700",
    marginTop: -4,
    marginBottom: 10,
  },

  missionRow: {
    gap: 10,
    paddingRight: 18,
    marginBottom: 16,
  },

  missionCard: {
    width: 168,
    minHeight: 58,
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
  },

  missionCardActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  missionTitle: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 4,
  },

  missionTitleActive: {
    color: ACTION_COLOR,
  },

  missionMeta: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "800",
  },

  missionMetaActive: {
    color: ACTION_COLOR,
  },

  videoMissionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },

  videoTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },

  videoTitleBox: {
    flex: 1,
    paddingRight: 10,
  },

  videoLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "900",
    marginBottom: 4,
  },

  videoTitle: {
    fontSize: 20,
    color: "#0F172A",
    fontWeight: "900",
  },

  durationBadge: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  durationText: {
    fontSize: 11,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  videoBox: {
    height: 210,
    borderRadius: 22,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    overflow: "hidden",
  },

  videoEmoji: {
    fontSize: 54,
    marginBottom: 12,
  },

  videoScene: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "800",
    textAlign: "center",
  },

  videoOverlay: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.14)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  videoOverlayText: {
    marginLeft: 8,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  contextGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  contextBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  contextLabel: {
    fontSize: 11,
    color: ACTION_COLOR,
    fontWeight: "900",
    marginBottom: 5,
  },

  contextText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#334155",
    fontWeight: "800",
  },

  blockHeading: {
    fontSize: 14,
    color: ACTION_COLOR,
    fontWeight: "900",
    marginTop: 14,
    marginBottom: 6,
  },

  promptText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#334155",
    fontWeight: "800",
  },

  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  starterChip: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  starterChipText: {
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  speakCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },

  speakTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  speakTextBox: {
    flex: 1,
    paddingRight: 10,
  },

  speakTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 5,
  },

  speakText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    fontWeight: "600",
  },

  liveButton: {
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  liveButtonText: {
    marginLeft: 5,
    color: ACTION_COLOR,
    fontSize: 12,
    fontWeight: "900",
  },

  recordBox: {
    marginTop: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },

  recordContentRight: {
    flex: 1,
    marginLeft: 10,
  },

  recordBoxActive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },

  micCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  waveBox: {
    width: 108,
    height: 34,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 6,
  },

  waveBar: {
    width: 8,
    borderRadius: 999,
    backgroundColor: RECORDING_COLOR,
  },

  recordStatusTitle: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 3,
  },

  recordStatusText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "700",
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

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  resetButton: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  resetButtonText: {
    marginLeft: 7,
    color: "#334155",
    fontSize: 14,
    fontWeight: "900",
  },

  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  primaryButtonRecording: {
    backgroundColor: RECORDING_COLOR,
  },

  primaryButtonText: {
    marginLeft: 7,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
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
    maxHeight: 460,
  },

  scoreGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  scoreMiniBox: {
    flex: 1,
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },

  scoreValue: {
    fontSize: 16,
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

  userAnswerBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 10,
  },

  userAnswerLabel: {
    fontSize: 12,
    color: "#991B1B",
    fontWeight: "900",
    marginBottom: 5,
  },

  userAnswerText: {
    fontSize: 15,
    lineHeight: 23,
    color: "#991B1B",
    fontWeight: "900",
  },

  correctBox: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 10,
  },

  correctLabel: {
    fontSize: 12,
    color: "#166534",
    fontWeight: "900",
    marginBottom: 5,
  },

  correctText: {
    fontSize: 15,
    lineHeight: 23,
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
    marginBottom: 10,
  },

  coachBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    marginBottom: 10,
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