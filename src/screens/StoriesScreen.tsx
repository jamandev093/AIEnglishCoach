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
  type AnalyzeApiResponse,
} from "../config/api";
import { addActivity } from "../utils/activityHistory";

import {
  defaultProfile,
  getProfile,
  type ProfileData,
} from "../utils/profileStore";

import {
  defaultSettings,
  getSettings,
  type AppSettings,
} from "../utils/settingsStore";

import {
  getDisplayLanguage,
  getLanguageModeLabel,
} from "../utils/languageMode";

type StoryLevel = "Beginner" | "Intermediate" | "Advanced";
type PracticeState = "idle" | "recording" | "completed";
type RepeatState = "idle" | "recording" | "saved";

type StoryFrame = {
  emoji: string;
  title: string;
  simpleLine: string;
  detail: string;
};

type StoryTask = {
  id: string;
  title: string;
  level: StoryLevel;
  topic: string;
  prompt: string;
  frames: StoryFrame[];
  hintWords: string[];
  sentenceStarters: string[];
  sampleUserStory: string;
  correctStory: string;
  englishMeaning: string;
  meaningHindi: string;
  meaningBengali: string;
  mistake: string;
  correction: string;
  teacherExplanation: string;
  smartSuggestion: string;
};

type StoryResultData = {
  userStory: string;
  betterStory: string;
  score: number;
  fluency: number;
  confidence: number;
  mistakes: string[];
  correction: string;
  teacherExplanation: string;
  smartSuggestion: string;
  repeatSentence: string;
  coachReply: string;
  usedBackend: boolean;
};

const ACTION_COLOR = "#8499DC";
const RECORDING_COLOR = "#DC2626";

const storyTasks: StoryTask[] = [
  {
    id: "morning-routine",
    title: "Morning Routine",
    level: "Beginner",
    topic: "Daily Life",
    prompt: "Look at the pictures and tell a simple morning story.",
    frames: [
      {
        emoji: "🛏️",
        title: "Wake Up",
        simpleLine: "A boy wakes up in the morning.",
        detail:
          "The boy is in bed. The sun is rising. This is the first action in the story.",
      },
      {
        emoji: "🪥",
        title: "Brush Teeth",
        simpleLine: "He brushes his teeth.",
        detail:
          "Now he is getting ready. He brushes his teeth before going out.",
      },
      {
        emoji: "🎒",
        title: "Go to School",
        simpleLine: "He goes to school.",
        detail:
          "He carries his school bag and leaves for school. This completes the morning routine.",
      },
    ],
    hintWords: ["wake up", "brush", "breakfast", "school", "morning"],
    sentenceStarters: ["First,", "Then,", "After that,"],
    sampleUserStory: "He wake up. Then he brush teeth. Then he go school.",
    correctStory:
      "First, he wakes up in the morning. Then he brushes his teeth. After that, he goes to school.",
    englishMeaning:
      "This story tells what the boy does in the morning before going to school.",
    meaningHindi:
      "यह कहानी बताती है कि लड़का सुबह स्कूल जाने से पहले क्या करता है।",
    meaningBengali:
      "এই গল্পে বলা হয়েছে ছেলেটি সকালে স্কুলে যাওয়ার আগে কী করে।",
    mistake: "Verb form mistakes: wake → wakes, brush → brushes, go → goes.",
    correction:
      "Use “wakes”, “brushes”, and “goes” because the subject is “he”.",
    teacherExplanation:
      "When the subject is he, she, or it, we usually add -s or -es to the verb in the simple present tense. So we say “he wakes”, “he brushes”, and “he goes”.",
    smartSuggestion:
      "First, he wakes up early. Then he brushes his teeth. After that, he gets ready and goes to school.",
  },
  {
    id: "market-visit",
    title: "Market Visit",
    level: "Intermediate",
    topic: "Real Life",
    prompt: "Look at the picture story and describe what happened.",
    frames: [
      {
        emoji: "🏠",
        title: "Leave Home",
        simpleLine: "A girl leaves home.",
        detail:
          "The girl starts from home. She carries a bag because she is going to buy something.",
      },
      {
        emoji: "🛒",
        title: "Buy Vegetables",
        simpleLine: "She buys vegetables in the market.",
        detail:
          "She is at the market. She chooses fresh vegetables and talks to the shopkeeper.",
      },
      {
        emoji: "🥦",
        title: "Return Home",
        simpleLine: "She returns home with vegetables.",
        detail:
          "After buying vegetables, she comes back home with her shopping bag.",
      },
    ],
    hintWords: ["home", "market", "vegetables", "buy", "return"],
    sentenceStarters: ["First,", "Next,", "Finally,"],
    sampleUserStory: "She go market. She buy vegetable. She come home.",
    correctStory:
      "First, she goes to the market. Next, she buys vegetables. Finally, she comes back home.",
    englishMeaning:
      "This story is about a girl who goes to the market, buys vegetables, and returns home.",
    meaningHindi:
      "यह कहानी एक लड़की के बारे में है जो बाज़ार जाती है, सब्जियाँ खरीदती है और घर लौटती है।",
    meaningBengali:
      "এই গল্পটি একটি মেয়েকে নিয়ে, যে বাজারে যায়, সবজি কেনে এবং বাড়ি ফিরে আসে।",
    mistake:
      "Missing “to” and wrong verb forms: go → goes, buy → buys, vegetable → vegetables.",
    correction:
      "Say “goes to the market”, “buys vegetables”, and “comes back home”.",
    teacherExplanation:
      "We say “goes to the market” because “to” connects the action with the place. We use “buys” because the subject is “she”. We say “vegetables” because she buys more than one vegetable.",
    smartSuggestion:
      "First, she goes to the market with a bag. Next, she buys fresh vegetables. Finally, she comes back home.",
  },
  {
    id: "rainy-day",
    title: "Rainy Day Help",
    level: "Advanced",
    topic: "Story",
    prompt: "Tell a full story using the pictures. Add feeling and reason.",
    frames: [
      {
        emoji: "🌧️",
        title: "Heavy Rain",
        simpleLine: "It is raining heavily.",
        detail:
          "The sky is dark and rain is falling heavily. Someone needs help to go home.",
      },
      {
        emoji: "☂️",
        title: "Friend Helps",
        simpleLine: "One friend shares an umbrella.",
        detail:
          "A friend notices the problem and shares an umbrella. This shows kindness.",
      },
      {
        emoji: "😊",
        title: "Both Are Happy",
        simpleLine: "Both friends reach home safely.",
        detail:
          "They walk together and reach home safely. Both friends feel happy and thankful.",
      },
    ],
    hintWords: ["rain", "umbrella", "friend", "help", "safely"],
    sentenceStarters: ["One day,", "Suddenly,", "In the end,"],
    sampleUserStory:
      "One day rain was coming. My friend give umbrella. We go home happy.",
    correctStory:
      "One day, it was raining heavily. Suddenly, my friend shared his umbrella with me. In the end, we reached home safely and felt happy.",
    englishMeaning:
      "This story shows how one friend helps another friend during heavy rain.",
    meaningHindi:
      "यह कहानी दिखाती है कि तेज बारिश में एक दोस्त दूसरे दोस्त की मदद करता है।",
    meaningBengali:
      "এই গল্পে দেখানো হয়েছে ভারী বৃষ্টির সময় এক বন্ধু আরেক বন্ধুকে সাহায্য করে।",
    mistake:
      "Wrong sentence structure and verb form: “rain was coming” should be “it was raining”; “give” should be “shared/gave”.",
    correction:
      "Say “it was raining heavily” and “my friend shared his umbrella with me”.",
    teacherExplanation:
      "For weather, we usually start with “it”. So we say “It was raining heavily.” Also, because the story happened in the past, we use past verbs like “shared” and “reached”.",
    smartSuggestion:
      "One day, it was raining heavily after school. My friend kindly shared his umbrella with me, and we reached home safely.",
  },
];

function getBaseScore(level: StoryLevel) {
  if (level === "Beginner") return 70;
  if (level === "Intermediate") return 68;
  return 65;
}

function buildDefaultResult(story: StoryTask): StoryResultData {
  const baseScore = getBaseScore(story.level);

  return {
    userStory: "",
    betterStory: story.correctStory,
    score: baseScore,
    fluency: Math.max(baseScore - 6, 0),
    confidence: Math.max(baseScore - 2, 0),
    mistakes: [story.mistake],
    correction: story.correction,
    teacherExplanation: story.teacherExplanation,
    smartSuggestion: story.smartSuggestion,
    repeatSentence: story.correctStory,
    coachReply: "Good try. Now repeat the improved story slowly and clearly.",
    usedBackend: false,
  };
}

function buildFallbackResult(
  story: StoryTask,
  spokenStory: string
): StoryResultData {
  const defaultResult = buildDefaultResult(story);

  return {
    ...defaultResult,
    userStory: spokenStory,
    usedBackend: false,
  };
}

function mapBackendResult(
  story: StoryTask,
  spokenStory: string,
  backendResult: AnalyzeApiResponse
): StoryResultData {
  const backendScore =
    typeof backendResult.score === "number" &&
    !Number.isNaN(backendResult.score)
      ? backendResult.score
      : getBaseScore(story.level);

  const correctedText =
    backendResult.correctedText ||
    backendResult.improved ||
    backendResult.repeatSentence ||
    story.correctStory;

  const mistakes =
    Array.isArray(backendResult.mistakes) && backendResult.mistakes.length > 0
      ? backendResult.mistakes
      : [story.mistake];

  return {
    userStory: backendResult.originalText || spokenStory,
    betterStory: correctedText,
    score: backendScore,
    fluency:
      typeof backendResult.fluencyScore === "number"
        ? backendResult.fluencyScore
        : Math.max(backendScore - 6, 0),
    confidence:
      typeof backendResult.confidenceScore === "number"
        ? backendResult.confidenceScore
        : Math.max(backendScore - 2, 0),
    mistakes,
    correction: backendResult.simpleExplanation || story.correction,
    teacherExplanation:
      backendResult.teacherExplanation || story.teacherExplanation,
    smartSuggestion:
      backendResult.smartSuggestion ||
      backendResult.coachReply ||
      story.smartSuggestion,
    repeatSentence: backendResult.repeatSentence || correctedText,
    coachReply:
      backendResult.coachReply ||
      "Good effort. Repeat the better story to build fluency.",
    usedBackend: true,
  };
}

export default function StoriesScreen() {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const [selectedStory, setSelectedStory] = useState<StoryTask>(storyTasks[0]);
  const [practiceState, setPracticeState] = useState<PracticeState>("idle");
  const [repeatState, setRepeatState] = useState<RepeatState>("idle");
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [resultData, setResultData] = useState<StoryResultData>(
    buildDefaultResult(storyTasks[0])
  );

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barOne = useRef(new Animated.Value(12)).current;
  const barTwo = useRef(new Animated.Value(26)).current;
  const barThree = useRef(new Animated.Value(16)).current;
  const barFour = useRef(new Animated.Value(31)).current;

  const isRecording =
    practiceState === "recording" || repeatState === "recording";

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

  const displayLanguage = getDisplayLanguage(profile, settings);
  const languageModeLabel = getLanguageModeLabel(profile, settings);

  const getStoryMeaning = () => {
    if (displayLanguage === "Bengali") return selectedStory.meaningBengali;
    if (displayLanguage === "Hindi") return selectedStory.meaningHindi;
    return selectedStory.englishMeaning;
  };

  const speakText = (text: string) => {
    if (!text.trim()) return;

    Speech.stop();
    Speech.speak(text, {
      language: "en-US",
      rate: 0.84,
    });
  };

  const chooseStory = (story: StoryTask) => {
    Speech.stop();
    setSelectedStory(story);
    setPracticeState("idle");
    setRepeatState("idle");
    setShowResultPopup(false);
    setResultData(buildDefaultResult(story));
  };

  const analyzeStoryWithBackend = async (spokenStory: string) => {
    try {
      const backendResult = await analyzeSentenceWithBackend(spokenStory);
      const mappedResult = mapBackendResult(
        selectedStory,
        spokenStory,
        backendResult
      );

      setResultData(mappedResult);
      return mappedResult;
    } catch (error) {
      console.log("Stories backend fallback:", error);

      const fallbackResult = buildFallbackResult(selectedStory, spokenStory);

      setResultData(fallbackResult);
      return fallbackResult;
    }
  };

  const saveStoryActivity = async (analyzedResult: StoryResultData) => {
    try {
      await addActivity({
        type: "stories",
        title: selectedStory.title,
        detail: `Story attempt: ${analyzedResult.userStory}`,
        score: analyzedResult.score,
        confidence: analyzedResult.confidence,
        fluency: analyzedResult.fluency,
        mistake: analyzedResult.mistakes.join(", "),
        correctedSentence: analyzedResult.betterStory,
      });
    } catch (error) {
      console.log("Failed to save story activity:", error);
    }
  };

  const stopAndAnalyzeStory = async () => {
    const simulatedStory = selectedStory.sampleUserStory;
    const analyzedResult = await analyzeStoryWithBackend(simulatedStory);

    setPracticeState("completed");
    setShowResultPopup(true);

    await saveStoryActivity(analyzedResult);
  };

  const handleMainStoryButton = async () => {
    if (repeatState === "recording") {
      const repeatSentence = resultData.repeatSentence || resultData.betterStory;

      setRepeatState("saved");

      try {
        await addActivity({
          type: "stories",
          title: "Story repeat practice",
          detail: `Repeated story: ${repeatSentence}`,
          score: Math.min(resultData.score + 8, 100),
          confidence: Math.min(resultData.confidence + 6, 100),
          fluency: Math.min(resultData.fluency + 6, 100),
          mistake: resultData.mistakes.join(", "),
          correctedSentence: repeatSentence,
        });
      } catch (error) {
        console.log("Failed to save story repeat activity:", error);
      }

      return;
    }

    if (repeatState === "saved") {
      setRepeatState("idle");
      setPracticeState("idle");
      setResultData(buildDefaultResult(selectedStory));
      return;
    }

    if (practiceState === "idle") {
      setPracticeState("recording");
      return;
    }

    if (practiceState === "recording") {
      await stopAndAnalyzeStory();
      return;
    }

    if (practiceState === "completed") {
      setRepeatState("recording");
      setPracticeState("idle");
    }
  };

  const startRepeatFromPopup = () => {
    setShowResultPopup(false);
    setRepeatState("recording");
    setPracticeState("idle");
  };

  const resetPractice = () => {
    Speech.stop();
    setPracticeState("idle");
    setRepeatState("idle");
    setShowResultPopup(false);
    setResultData(buildDefaultResult(selectedStory));
  };

  const openLiveStory = () => {
    Alert.alert(
      "Live Story Coming Soon",
      "Later this will open a real live AI story conversation. For MVP, use Start to practice the story."
    );
  };

  const getMainButtonText = () => {
    if (repeatState === "recording") return "Save Repeat";
    if (repeatState === "saved") return "Practice Again";
    if (practiceState === "idle") return "Start";
    if (practiceState === "recording") return "Stop & Check";
    return "Repeat";
  };

  const getMainButtonIcon = (): keyof typeof Ionicons.glyphMap => {
    if (repeatState === "recording") return "checkmark-outline";
    if (repeatState === "saved") return "refresh-outline";
    if (practiceState === "idle") return "mic-outline";
    if (practiceState === "recording") return "stop";
    return "repeat-outline";
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

          <Text style={styles.headerTitle}>Story Speaking</Text>

          <View style={styles.emptyBox} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choose Story</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storyRow}
        >
          {storyTasks.map((story) => {
            const active = story.id === selectedStory.id;

            return (
              <TouchableOpacity
                key={story.id}
                style={[styles.storyCard, active && styles.storyCardActive]}
                onPress={() => chooseStory(story)}
                activeOpacity={0.85}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.storyTitle, active && styles.storyTitleActive]}
                >
                  {story.title}
                </Text>

                <Text
                  numberOfLines={1}
                  style={[styles.storyTopic, active && styles.storyTopicActive]}
                >
                  {story.topic}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.imageStoryCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardTitleBox}>
              <Text style={styles.cardLabel}>Picture Story</Text>
              <Text style={styles.cardTitle}>{selectedStory.title}</Text>
            </View>

            <View style={styles.storyCountBadge}>
              <Text style={styles.storyCountText}>
                {selectedStory.frames.length} pictures
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.frameRow}
          >
            {selectedStory.frames.map((frame, index) => (
              <View key={`${frame.title}-${index}`} style={styles.frameCard}>
                <View style={styles.frameTopRow}>
                  <Text style={styles.frameNumber}>Picture {index + 1}</Text>
                  <View style={styles.frameDot} />
                </View>

                <View style={styles.frameImageBox}>
                  <Text style={styles.frameEmoji}>{frame.emoji}</Text>
                </View>

                <Text style={styles.frameTitle}>{frame.title}</Text>
                <Text style={styles.frameText}>{frame.simpleLine}</Text>
                <Text style={styles.frameDetail}>{frame.detail}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.storyHelperBox}>
            <Text style={styles.helperTitle}>Use these story starters</Text>

            <View style={styles.chipWrap}>
              {selectedStory.sentenceStarters.map((starter) => (
                <View key={starter} style={styles.helperChip}>
                  <Text style={styles.helperChipText}>{starter}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.helperTitleSecond}>Hint words</Text>

            <View style={styles.chipWrap}>
              {selectedStory.hintWords.map((word) => (
                <View key={word} style={styles.wordChip}>
                  <Text style={styles.wordChipText}>{word}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.speakCard}>
          <View style={styles.speakTopRow}>
            <View style={styles.speakTextBox}>
              <Text style={styles.speakTitle}>Tell the Story</Text>
              <Text style={styles.speakText}>
                Look carefully at the pictures and tell the full story in your
                own words.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.liveButton}
              onPress={openLiveStory}
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
                size={29}
                color={isRecording ? "#FFFFFF" : ACTION_COLOR}
              />
            </Animated.View>

            <View style={styles.waveBox}>
              <Animated.View style={[styles.waveBar, { height: barOne }]} />
              <Animated.View style={[styles.waveBar, { height: barTwo }]} />
              <Animated.View style={[styles.waveBar, { height: barThree }]} />
              <Animated.View style={[styles.waveBar, { height: barFour }]} />
            </View>

            <Text style={styles.recordStatusTitle}>
              {isRecording
                ? "Recording..."
                : repeatState === "saved"
                ? "Repeat saved"
                : practiceState === "completed"
                ? "Story checked"
                : "Ready"}
            </Text>

            <Text style={styles.recordStatusText}>
              {isRecording
                ? "Speak the story aloud."
                : repeatState === "saved"
                ? "Your repeat practice was saved to Progress."
                : practiceState === "completed"
                ? "Tap Repeat to say the improved story."
                : "Tap Start and tell what you see in the pictures."}
            </Text>
          </View>

          {repeatState === "saved" && (
            <View style={styles.savedBox}>
              <Ionicons name="checkmark-circle" size={21} color="#16A34A" />
              <Text style={styles.savedText}>Story repeat saved to Progress.</Text>
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetPractice}
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
              onPress={handleMainStoryButton}
              activeOpacity={0.85}
            >
              <Ionicons name={getMainButtonIcon()} size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>{getMainButtonText()}</Text>
            </TouchableOpacity>
          </View>
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
                <Ionicons name="sparkles-outline" size={23} color={ACTION_COLOR} />
              </View>

              <View style={styles.modalTitleBox}>
                <Text style={styles.modalLabel}>Story Result</Text>
                <Text style={styles.modalTitle}>Story corrected</Text>
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
              <View style={styles.resultBox}>
                <Text style={styles.resultLabel}>Result</Text>
                <Text style={styles.resultText}>
                  {resultData.coachReply}
                </Text>
              </View>

              <View style={styles.scoreGrid}>
                <View style={styles.scoreMiniBox}>
                  <Text style={styles.scoreValue}>{resultData.score}%</Text>
                  <Text style={styles.scoreLabel}>Story</Text>
                </View>

                <View style={styles.scoreMiniBox}>
                  <Text style={styles.scoreValue}>{resultData.fluency}%</Text>
                  <Text style={styles.scoreLabel}>Fluency</Text>
                </View>

                <View style={styles.scoreMiniBox}>
                  <Text style={styles.scoreValue}>{resultData.confidence}%</Text>
                  <Text style={styles.scoreLabel}>Confidence</Text>
                </View>
              </View>

              <View style={styles.userAnswerBox}>
                <Text style={styles.userAnswerLabel}>Your answer</Text>
                <Text style={styles.userAnswerText}>
                  {resultData.userStory || selectedStory.sampleUserStory}
                </Text>
              </View>

              <View style={styles.correctBox}>
                <Text style={styles.correctLabel}>Better story</Text>
                <Text style={styles.correctText}>{resultData.betterStory}</Text>

                <TouchableOpacity
                  style={styles.modalSmallButton}
                  onPress={() => speakText(resultData.betterStory)}
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

                {resultData.mistakes.map((mistake) => (
                  <Text key={mistake} style={styles.modalInfoText}>
                    • {mistake}
                  </Text>
                ))}
              </View>

              <View style={styles.modalInfoBox}>
                <View style={styles.modalInfoTopRow}>
                  <MaterialCommunityIcons
                    name="lightbulb-on-outline"
                    size={22}
                    color={ACTION_COLOR}
                  />
                  <Text style={styles.modalInfoTitle}>Correction</Text>
                </View>

                <Text style={styles.modalInfoText}>{resultData.correction}</Text>
              </View>

              <View style={styles.teacherBox}>
                <View style={styles.modalInfoTopRow}>
                  <Ionicons
                    name="school-outline"
                    size={22}
                    color={ACTION_COLOR}
                  />
                  <Text style={styles.modalInfoTitle}>Teacher Explanation</Text>
                </View>

                <Text style={styles.modalInfoText}>
                  {resultData.teacherExplanation}
                </Text>
              </View>

              <View style={styles.meaningBox}>
                <View style={styles.meaningHeader}>
                  <Text style={styles.modalSectionTitle}>Meaning</Text>

                  <View style={styles.languagePill}>
                    <Text style={styles.languagePillText}>
                      {languageModeLabel}
                    </Text>
                  </View>
                </View>

                <Text style={styles.meaningText}>{getStoryMeaning()}</Text>
              </View>

              <View style={styles.suggestionBox}>
                <Text style={styles.modalSectionTitle}>Smart Suggestion</Text>
                <Text style={styles.suggestionText}>
                  {resultData.smartSuggestion}
                </Text>

                <TouchableOpacity
                  style={styles.modalSmallButton}
                  onPress={() => speakText(resultData.smartSuggestion)}
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
                    <Ionicons name="mic-outline" size={23} color={ACTION_COLOR} />
                  </View>

                  <View style={styles.modalRepeatTextBox}>
                    <Text style={styles.modalRepeatTitle}>Repeat It</Text>
                    <Text style={styles.modalRepeatSubtitle}>
                      Repeat the improved story to build speaking confidence.
                    </Text>
                  </View>
                </View>

                <View style={styles.modalRepeatSentenceBox}>
                  <Text style={styles.modalRepeatSentence}>
                    {resultData.repeatSentence}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalLightButton}
                onPress={() => speakText(resultData.repeatSentence)}
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

  storyRow: {
    gap: 10,
    paddingRight: 18,
    marginBottom: 16,
  },

  storyCard: {
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

  storyCardActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  storyTitle: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 4,
  },

  storyTitleActive: {
    color: ACTION_COLOR,
  },

  storyTopic: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "800",
  },

  storyTopicActive: {
    color: ACTION_COLOR,
  },

  imageStoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  cardTitleBox: {
    flex: 1,
    paddingRight: 10,
  },

  cardLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "900",
    marginBottom: 4,
  },

  cardTitle: {
    fontSize: 20,
    color: "#0F172A",
    fontWeight: "900",
  },

  storyCountBadge: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  storyCountText: {
    fontSize: 11,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  frameRow: {
    gap: 12,
    paddingRight: 10,
  },

  frameCard: {
    width: 220,
    minHeight: 300,
    backgroundColor: "#F8FAFC",
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  frameTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  frameNumber: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "900",
  },

  frameDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: ACTION_COLOR,
  },

  frameImageBox: {
    height: 120,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 12,
  },

  frameEmoji: {
    fontSize: 68,
  },

  frameTitle: {
    fontSize: 18,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 7,
  },

  frameText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#334155",
    fontWeight: "800",
    marginBottom: 8,
  },

  frameDetail: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "700",
  },

  storyHelperBox: {
    marginTop: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  helperTitle: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "900",
    marginBottom: 9,
  },

  helperTitleSecond: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "900",
    marginTop: 12,
    marginBottom: 9,
  },

  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  helperChip: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  helperChipText: {
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  wordChip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  wordChipText: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "900",
  },

  speakCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
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
    marginTop: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },

  recordBoxActive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },

  micCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  waveBox: {
    width: 116,
    height: 40,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginBottom: 10,
  },

  waveBar: {
    width: 8,
    borderRadius: 999,
    backgroundColor: RECORDING_COLOR,
  },

  recordStatusTitle: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 5,
  },

  recordStatusText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    fontWeight: "700",
    textAlign: "center",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
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

  resultBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    marginBottom: 12,
  },

  resultLabel: {
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
    marginBottom: 5,
  },

  resultText: {
    fontSize: 13,
    lineHeight: 21,
    color: "#334155",
    fontWeight: "800",
  },

  scoreGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  scoreMiniBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
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

  userAnswerBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 12,
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
    marginBottom: 12,
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

  meaningBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },

  meaningHeader: {
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

  meaningText: {
    fontSize: 13,
    lineHeight: 21,
    color: "#334155",
    fontWeight: "700",
  },

  suggestionBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    marginBottom: 12,
  },

  suggestionText: {
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