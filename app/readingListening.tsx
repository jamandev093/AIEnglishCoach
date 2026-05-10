import { Ionicons } from "@expo/vector-icons";
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

import { analyzeSentenceWithBackend } from "../src/config/api";
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

import { getDisplayLanguage } from "../src/utils/languageMode";

type PracticeState = "idle" | "recording" | "checked";
type RepeatState = "idle" | "recording" | "saved";

type KeyWord = {
  word: string;
  hindi: string;
  bengali: string;
  english: string;
};

type StoryQuestion = {
  question: string;
  answer: string;
};

type StoryItem = {
  title: string;
  topic: string;
  pictureEmoji: string;
  pictureTitle: string;
  story: string;
  hindiSummary: string;
  bengaliSummary: string;
  englishSummary: string;
  keyWords: KeyWord[];
  questions: StoryQuestion[];
};

type ResultData = {
  score: number;
  listeningScore: number;
  speakingScore: number;
  repeatAccuracy: number;
  userAnswer: string;
  correction: string;
  mistake: string;
  coachTip: string;
};

const ACTION_COLOR = "#8499DC";
const RECORDING_COLOR = "#DC2626";

const stories: StoryItem[] = [
  {
    title: "A Morning Market Visit",
    topic: "Daily Life",
    pictureEmoji: "🛒",
    pictureTitle: "Morning market",
    story:
      "Today I went to the market. I bought vegetables and fruit. The shopkeeper was friendly. I asked the price and paid with cash.",
    hindiSummary:
      "आज मैं बाज़ार गया। मैंने सब्ज़ियाँ और फल खरीदे। दुकानदार अच्छा था। मैंने कीमत पूछी और नकद पैसे दिए।",
    bengaliSummary:
      "আজ আমি বাজারে গিয়েছিলাম। আমি সবজি ও ফল কিনেছি। দোকানদার ভালো ছিল। আমি দাম জিজ্ঞেস করেছি এবং নগদ টাকা দিয়েছি।",
    englishSummary:
      "The speaker visited the market, bought food, asked the price, and paid with cash.",
    keyWords: [
      {
        word: "market",
        hindi: "बाज़ार",
        bengali: "বাজার",
        english: "place to buy things",
      },
      {
        word: "bought",
        hindi: "खरीदा",
        bengali: "কিনেছি",
        english: "purchased",
      },
      {
        word: "vegetables",
        hindi: "सब्ज़ियाँ",
        bengali: "সবজি",
        english: "green food plants",
      },
      {
        word: "price",
        hindi: "कीमत",
        bengali: "দাম",
        english: "cost",
      },
      {
        word: "cash",
        hindi: "नकद",
        bengali: "নগদ টাকা",
        english: "money notes or coins",
      },
    ],
    questions: [
      {
        question: "Where did the speaker go today?",
        answer: "The speaker went to the market.",
      },
      {
        question: "What did the speaker buy?",
        answer: "The speaker bought vegetables and fruit.",
      },
      {
        question: "How was the shopkeeper?",
        answer: "The shopkeeper was friendly.",
      },
      {
        question: "How did the speaker pay?",
        answer: "The speaker paid with cash.",
      },
    ],
  },
  {
    title: "At the Doctor",
    topic: "Health",
    pictureEmoji: "🏥",
    pictureTitle: "Doctor visit",
    story:
      "I visited the doctor because I had a fever. The doctor checked me and gave me medicine. He told me to drink water and rest.",
    hindiSummary:
      "मुझे बुखार था इसलिए मैं डॉक्टर के पास गया। डॉक्टर ने जांच की और दवा दी। उन्होंने पानी पीने और आराम करने को कहा।",
    bengaliSummary:
      "আমার জ্বর ছিল, তাই আমি ডাক্তারের কাছে গিয়েছিলাম। ডাক্তার আমাকে পরীক্ষা করে ওষুধ দিয়েছেন। তিনি পানি পান করতে এবং বিশ্রাম নিতে বলেছেন।",
    englishSummary:
      "The speaker had a fever, visited the doctor, got medicine, and was told to rest.",
    keyWords: [
      {
        word: "doctor",
        hindi: "डॉक्टर",
        bengali: "ডাক্তার",
        english: "medical person",
      },
      {
        word: "fever",
        hindi: "बुखार",
        bengali: "জ্বর",
        english: "high body temperature",
      },
      {
        word: "checked",
        hindi: "जांच की",
        bengali: "পরীক্ষা করেছেন",
        english: "examined",
      },
      {
        word: "medicine",
        hindi: "दवा",
        bengali: "ওষুধ",
        english: "treatment drug",
      },
      {
        word: "rest",
        hindi: "आराम",
        bengali: "বিশ্রাম",
        english: "relax or recover",
      },
    ],
    questions: [
      {
        question: "Why did the speaker visit the doctor?",
        answer: "The speaker visited the doctor because he had a fever.",
      },
      {
        question: "What did the doctor give?",
        answer: "The doctor gave medicine.",
      },
      {
        question: "What did the doctor tell the speaker to do?",
        answer: "The doctor told the speaker to drink water and rest.",
      },
    ],
  },
  {
    title: "First Day at Work",
    topic: "Work",
    pictureEmoji: "💼",
    pictureTitle: "First work day",
    story:
      "It was my first day at work. I met my manager and introduced myself to the team. I felt nervous at first, but everyone was helpful.",
    hindiSummary:
      "यह मेरा काम का पहला दिन था। मैं अपने मैनेजर से मिला और टीम से अपना परिचय कराया। पहले मैं घबराया हुआ था, लेकिन सभी मददगार थे।",
    bengaliSummary:
      "এটি ছিল আমার কাজের প্রথম দিন। আমি আমার ম্যানেজারের সাথে দেখা করেছি এবং টিমের কাছে নিজেকে পরিচয় করিয়েছি। প্রথমে নার্ভাস লাগছিল, কিন্তু সবাই সাহায্য করেছে।",
    englishSummary:
      "The speaker started a new job, met the manager, introduced himself, and felt supported.",
    keyWords: [
      {
        word: "manager",
        hindi: "मैनेजर",
        bengali: "ম্যানেজার",
        english: "work leader",
      },
      {
        word: "introduced",
        hindi: "परिचय कराया",
        bengali: "পরিচয় করিয়েছি",
        english: "told who someone is",
      },
      {
        word: "team",
        hindi: "टीम",
        bengali: "টিম",
        english: "group working together",
      },
      {
        word: "nervous",
        hindi: "घबराया हुआ",
        bengali: "নার্ভাস",
        english: "worried or anxious",
      },
      {
        word: "helpful",
        hindi: "मददगार",
        bengali: "সহায়ক",
        english: "ready to help",
      },
    ],
    questions: [
      {
        question: "How did the speaker feel at first?",
        answer: "The speaker felt nervous at first.",
      },
      {
        question: "Who did the speaker meet?",
        answer: "The speaker met the manager.",
      },
      {
        question: "What did the speaker do with the team?",
        answer: "The speaker introduced himself to the team.",
      },
      {
        question: "How were the people at work?",
        answer: "Everyone was helpful.",
      },
    ],
  },
];

export default function ReadingListeningScreen() {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const [selectedStory, setSelectedStory] = useState<StoryItem>(stories[0]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [practiceState, setPracticeState] = useState<PracticeState>("idle");
  const [repeatState, setRepeatState] = useState<RepeatState>("idle");
  const [showResultPopup, setShowResultPopup] = useState(false);

  const selectedQuestion = selectedStory.questions[selectedQuestionIndex];

  const [resultData, setResultData] = useState<ResultData>({
    score: 74,
    listeningScore: 78,
    speakingScore: 70,
    repeatAccuracy: 72,
    userAnswer: "",
    correction: stories[0].questions[0].answer,
    mistake: "Try to speak the story in a complete sentence, not only one word.",
    coachTip:
      "Good listening. Now repeat one full sentence from the story slowly and clearly.",
  });

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barOne = useRef(new Animated.Value(12)).current;
  const barTwo = useRef(new Animated.Value(28)).current;
  const barThree = useRef(new Animated.Value(18)).current;
  const barFour = useRef(new Animated.Value(34)).current;

  const isRecording =
    practiceState === "recording" || repeatState === "recording";

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

  useEffect(() => {
    if (!isRecording) {
      pulseAnim.setValue(1);
      barOne.setValue(12);
      barTwo.setValue(28);
      barThree.setValue(18);
      barFour.setValue(34);
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
            toValue: 30,
            duration: 470,
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
            toValue: 16,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(barFour, {
            toValue: 34,
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

  const speakText = (text: string) => {
    if (!text.trim()) return;

    Speech.stop();
    Speech.speak(text, {
      language: "en-US",
      rate: 0.82,
    });
  };

  const getSummary = () => {
    if (displayLanguage === "Bengali") return selectedStory.bengaliSummary;
    if (displayLanguage === "Hindi") return selectedStory.hindiSummary;

    return selectedStory.englishSummary;
  };

  const getKeywordMeaning = (item: KeyWord) => {
    if (displayLanguage === "Bengali") return item.bengali;
    if (displayLanguage === "Hindi") return item.hindi;

    return item.english;
  };

  const keyWordsLine = selectedStory.keyWords
    .map((item) => `${item.word} (${getKeywordMeaning(item)})`)
    .join(", ");

  const resetResultData = (story: StoryItem, questionIndex = 0) => {
    setResultData({
      score: 74,
      listeningScore: 78,
      speakingScore: 70,
      repeatAccuracy: 72,
      userAnswer: "",
      correction: story.questions[questionIndex].answer,
      mistake:
        "Try to speak the story in a complete sentence, not only one word.",
      coachTip:
        "Good listening. Now repeat one full sentence from the story slowly and clearly.",
    });
  };

  const chooseStory = (story: StoryItem) => {
    setSelectedStory(story);
    setSelectedQuestionIndex(0);
    setPracticeState("idle");
    setRepeatState("idle");
    setShowResultPopup(false);
    resetResultData(story, 0);
  };

  const goNextQuestion = () => {
    setSelectedQuestionIndex((prev) => {
      const nextIndex = prev >= selectedStory.questions.length - 1 ? 0 : prev + 1;
      resetResultData(selectedStory, nextIndex);
      return nextIndex;
    });

    setPracticeState("idle");
    setRepeatState("idle");
    setShowResultPopup(false);
  };

  const goPreviousQuestion = () => {
    setSelectedQuestionIndex((prev) => {
      const nextIndex = prev <= 0 ? selectedStory.questions.length - 1 : prev - 1;
      resetResultData(selectedStory, nextIndex);
      return nextIndex;
    });

    setPracticeState("idle");
    setRepeatState("idle");
    setShowResultPopup(false);
  };

  const saveReadingListeningActivity = async (data: ResultData) => {
    await addActivity({
      type: "readingListening",
      title: "Reading & Listening practice",
      detail: `Listened and practiced: ${selectedStory.title}`,
      score: data.score,
      confidence: 62,
      fluency: data.speakingScore,
      mistake: data.mistake,
      correctedSentence: data.correction,
    });
  };

  const checkAnswerWithBackend = async (answerText: string) => {
    try {
      const backendResult = await analyzeSentenceWithBackend(answerText);

      const mistakes =
        backendResult.mistakes && backendResult.mistakes.length > 0
          ? backendResult.mistakes.join(", ")
          : "No major mistake found. Try to speak smoothly and clearly.";

      const newResult: ResultData = {
        score: backendResult.score || 78,
        listeningScore: 80,
        speakingScore: backendResult.fluencyScore || Math.max((backendResult.score || 78) - 6, 0),
        repeatAccuracy: backendResult.pronunciationScore || Math.max((backendResult.score || 78) - 4, 0),
        userAnswer: backendResult.originalText || answerText,
        correction:
          backendResult.correctedText ||
          backendResult.improved ||
          selectedQuestion.answer,
        mistake: mistakes,
        coachTip:
          backendResult.smartSuggestion ||
          backendResult.coachReply ||
          backendResult.simpleExplanation ||
          "Good attempt. Listen once more, then repeat the answer clearly.",
      };

      setResultData(newResult);
      await saveReadingListeningActivity(newResult);
    } catch (error) {
      console.log("Reading & Listening backend error:", error);

      const fallbackResult: ResultData = {
        score: 76,
        listeningScore: 80,
        speakingScore: 72,
        repeatAccuracy: 74,
        userAnswer: answerText,
        correction: selectedQuestion.answer,
        mistake:
          "Backend is not reachable, so this is the local MVP result. Try to answer with a full sentence using words from the story.",
        coachTip:
          "Listen once more, then repeat the correct answer slowly and clearly.",
      };

      setResultData(fallbackResult);
      await saveReadingListeningActivity(fallbackResult);
    }
  };

  const handleDynamicSpeaking = async () => {
    if (repeatState === "recording") {
      const repeatAnswer = resultData.correction || selectedQuestion.answer;

      await checkAnswerWithBackend(repeatAnswer);

      setRepeatState("saved");
      setShowResultPopup(true);
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
      const simulatedUserAnswer = selectedQuestion.answer;

      await checkAnswerWithBackend(simulatedUserAnswer);

      setPracticeState("checked");
      setShowResultPopup(true);
      return;
    }

    if (practiceState === "checked") {
      setPracticeState("idle");
      setRepeatState("recording");
    }
  };

  const getDynamicButtonText = () => {
    if (repeatState === "recording") return "Stop Repeat";
    if (repeatState === "saved") return "Practice Again";
    if (practiceState === "recording") return "Stop & Check";
    if (practiceState === "checked") return "Repeat";
    return "Speak";
  };

  const getDynamicButtonIcon = (): keyof typeof Ionicons.glyphMap => {
    if (repeatState === "recording") return "stop";
    if (repeatState === "saved") return "refresh-outline";
    if (practiceState === "recording") return "stop";
    if (practiceState === "checked") return "repeat-outline";
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Reading & Listening</Text>

          <View style={styles.emptyBox} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Stories List</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storyTabs}
        >
          {stories.map((story) => {
            const active = selectedStory.title === story.title;

            return (
              <TouchableOpacity
                key={story.title}
                style={[styles.storyTab, active && styles.storyTabActive]}
                onPress={() => chooseStory(story)}
                activeOpacity={0.85}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.storyTabTitle,
                    active && styles.storyTabTitleActive,
                  ]}
                >
                  {story.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.storyCard}>
          <Text style={styles.storyTitle}>{selectedStory.title}</Text>

          <View style={styles.storyImageBox}>
            <Text style={styles.storyImageEmoji}>
              {selectedStory.pictureEmoji}
            </Text>
            <Text style={styles.storyImageTitle}>
              {selectedStory.pictureTitle}
            </Text>
          </View>

          <Text style={styles.blockHeading}>Story:</Text>
          <Text style={styles.storyText}>{selectedStory.story}</Text>

          <Text style={styles.blockHeading}>Meaning:</Text>
          <Text style={styles.meaningText}>{getSummary()}</Text>

          <Text style={styles.blockHeading}>Key Words:</Text>
          <Text style={styles.keyWordsText}>{keyWordsLine}</Text>

          <View style={styles.questionLine}>
            <View style={styles.questionHeaderRow}>
              <Text style={styles.questionLabel}>
                Question {selectedQuestionIndex + 1}/
                {selectedStory.questions.length}
              </Text>

              <View style={styles.questionArrowRow}>
                <TouchableOpacity
                  style={styles.questionArrow}
                  onPress={goPreviousQuestion}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="chevron-back"
                    size={18}
                    color={ACTION_COLOR}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.questionArrow}
                  onPress={goNextQuestion}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={ACTION_COLOR}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.questionText}>{selectedQuestion.question}</Text>
          </View>

          <View style={styles.recordingBox}>
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
                size={28}
                color={isRecording ? "#FFFFFF" : ACTION_COLOR}
              />
            </Animated.View>

            <View style={styles.waveBox}>
              <Animated.View style={[styles.waveBar, { height: barOne }]} />
              <Animated.View style={[styles.waveBar, { height: barTwo }]} />
              <Animated.View style={[styles.waveBar, { height: barThree }]} />
              <Animated.View style={[styles.waveBar, { height: barFour }]} />
            </View>

            <View style={styles.statusTextBox}>
              <Text style={styles.statusTitle}>
                {isRecording
                  ? "Recording..."
                  : repeatState === "saved"
                  ? "Repeat saved"
                  : practiceState === "checked"
                  ? "Result ready"
                  : "Ready"}
              </Text>

              <Text style={styles.statusText}>
                {isRecording
                  ? "Speak clearly using the story."
                  : repeatState === "saved"
                  ? "Repeat practice was saved to Progress."
                  : practiceState === "checked"
                  ? "Tap Repeat or open popup to see your result."
                  : "Listen first, then answer the question."}
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.listenButton}
              onPress={() => speakText(selectedStory.story)}
              activeOpacity={0.85}
            >
              <Ionicons
                name="volume-high-outline"
                size={18}
                color={ACTION_COLOR}
              />
              <Text style={styles.listenButtonText}>Listening</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.speakButton,
                isRecording && styles.recordingButton,
              ]}
              onPress={handleDynamicSpeaking}
              activeOpacity={0.85}
            >
              <Ionicons
                name={getDynamicButtonIcon()}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.speakButtonText}>
                {getDynamicButtonText()}
              </Text>
            </TouchableOpacity>
          </View>

          {practiceState === "checked" && (
            <TouchableOpacity
              style={styles.openResultButton}
              onPress={() => setShowResultPopup(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="expand-outline" size={18} color={ACTION_COLOR} />
              <Text style={styles.openResultText}>Open Results</Text>
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
                <Text style={styles.modalLabel}>Results</Text>
                <Text style={styles.modalTitle}>
                  Reading & Listening feedback
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
              <View style={styles.scoreRow}>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreValue}>{resultData.score}%</Text>
                  <Text style={styles.scoreLabel}>Overall</Text>
                </View>

                <View style={styles.scoreBox}>
                  <Text style={styles.scoreValue}>
                    {resultData.listeningScore}%
                  </Text>
                  <Text style={styles.scoreLabel}>Listening</Text>
                </View>

                <View style={styles.scoreBox}>
                  <Text style={styles.scoreValue}>
                    {resultData.speakingScore}%
                  </Text>
                  <Text style={styles.scoreLabel}>Speaking</Text>
                </View>
              </View>

              <View style={styles.userAnswerBox}>
                <Text style={styles.userAnswerLabel}>Your Answer</Text>
                <Text style={styles.userAnswerText}>
                  {resultData.userAnswer || "No answer recorded"}
                </Text>
              </View>

              <View style={styles.resultBox}>
                <Text style={styles.resultLabel}>Corrected Answer</Text>
                <Text style={styles.resultText}>{resultData.correction}</Text>

                <TouchableOpacity
                  style={styles.modalSmallButton}
                  onPress={() => speakText(resultData.correction)}
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

              <View style={styles.mistakeBox}>
                <Text style={styles.mistakeTitle}>Mistake / Focus</Text>
                <Text style={styles.mistakeText}>{resultData.mistake}</Text>
              </View>

              <View style={styles.repeatAccuracyBox}>
                <Text style={styles.repeatAccuracyLabel}>Repeat Accuracy</Text>
                <Text style={styles.repeatAccuracyValue}>
                  {resultData.repeatAccuracy}%
                </Text>
              </View>

              <View style={styles.coachBox}>
                <Text style={styles.coachTitle}>Coach Tip</Text>
                <Text style={styles.coachText}>{resultData.coachTip}</Text>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalLightButton}
                onPress={() => speakText(selectedStory.story)}
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
                onPress={() => {
                  setShowResultPopup(false);
                  setRepeatState("recording");
                  setPracticeState("idle");
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="repeat-outline" size={18} color="#FFFFFF" />
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

  storyTabs: {
    gap: 10,
    paddingRight: 18,
    marginBottom: 18,
  },

  storyTab: {
    width: 190,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  storyTabActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  storyTabTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },

  storyTabTitleActive: {
    color: ACTION_COLOR,
  },

  storyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  storyTitle: {
    fontSize: 24,
    lineHeight: 31,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 14,
  },

  storyImageBox: {
    height: 150,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  storyImageEmoji: {
    fontSize: 52,
    marginBottom: 8,
  },

  storyImageTitle: {
    fontSize: 15,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  blockHeading: {
    fontSize: 15,
    color: ACTION_COLOR,
    fontWeight: "900",
    marginTop: 12,
    marginBottom: 6,
  },

  storyText: {
    fontSize: 16,
    lineHeight: 25,
    color: "#334155",
    fontWeight: "700",
  },

  meaningText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
    fontWeight: "800",
  },

  keyWordsText: {
    fontSize: 13,
    lineHeight: 21,
    color: "#334155",
    fontWeight: "700",
  },

  questionLine: {
    marginTop: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  questionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  questionLabel: {
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  questionArrowRow: {
    flexDirection: "row",
    gap: 8,
  },

  questionArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  questionText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#0F172A",
    fontWeight: "900",
  },

  recordingBox: {
    marginTop: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
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
    marginRight: 10,
  },

  waveBox: {
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
  },

  waveBar: {
    width: 7,
    borderRadius: 999,
    backgroundColor: RECORDING_COLOR,
  },

  statusTextBox: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 3,
  },

  statusText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#64748B",
    fontWeight: "600",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },

  listenButton: {
    flex: 1,
    height: 48,
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

  speakButton: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  recordingButton: {
    backgroundColor: RECORDING_COLOR,
  },

  speakButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 7,
  },

  openResultButton: {
    marginTop: 10,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  openResultText: {
    marginLeft: 7,
    fontSize: 14,
    color: ACTION_COLOR,
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
    maxHeight: 460,
  },

  scoreRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  scoreBox: {
    flex: 1,
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 12,
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

  resultBox: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 10,
  },

  resultLabel: {
    fontSize: 12,
    color: "#166534",
    fontWeight: "900",
    marginBottom: 5,
  },

  resultText: {
    fontSize: 16,
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

  mistakeBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 10,
  },

  mistakeTitle: {
    fontSize: 13,
    color: "#991B1B",
    fontWeight: "900",
    marginBottom: 6,
  },

  mistakeText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#991B1B",
    fontWeight: "700",
  },

  repeatAccuracyBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  repeatAccuracyLabel: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "900",
  },

  repeatAccuracyValue: {
    fontSize: 14,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  coachBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    marginBottom: 4,
  },

  coachTitle: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 6,
  },

  coachText: {
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