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

import {
  analyzeSentenceWithBackend,
  type AnalyzeApiResponse,
} from "../src/config/api";
import { addActivity } from "../src/utils/activityHistory";

import {
  defaultProfile,
  getProfile,
  type ProfileData,
} from "../src/utils/profileStore";

import {
  defaultSettings,
  getSettings,
  type AppSettings,
} from "../src/utils/settingsStore";

import {
  getDisplayLanguage,
  getLanguageModeLabel,
} from "../src/utils/languageMode";

type PracticeState = "idle" | "recording" | "checked";
type RepeatState = "idle" | "recording" | "saved";

type VocabWord = {
  word: string;
  hindi: string;
  bengali: string;
  english: string;
  simpleMeaning: string;
  example: string;
  nativeStyle: string;
  userPrompt: string;
  mistakeTip: string;
  usage: string;
  wordFamily: string[];
  category: string;
};

type Category = {
  title: string;
  emoji: string;
};

type ResultData = {
  score: number;
  confidenceScore: number;
  fluencyScore: number;
  speakingScore: number;
  word: string;
  userSentence: string;
  betterSentence: string;
  mistake: string;
  coachTip: string;
  repeatSentence: string;
  usedBackend: boolean;
};

const ACTION_COLOR = "#8499DC";
const RECORDING_COLOR = "#DC2626";

const categories: Category[] = [
  { title: "Daily Life", emoji: "🏠" },
  { title: "Market", emoji: "🛒" },
  { title: "Work", emoji: "💼" },
  { title: "Travel", emoji: "✈️" },
];

const words: VocabWord[] = [
  {
    word: "Market",
    hindi: "बाज़ार",
    bengali: "বাজার",
    english: "A place where people buy and sell things.",
    simpleMeaning: "A place where we buy things.",
    example: "I went to the market.",
    nativeStyle: "Yesterday, I went to the market to buy vegetables.",
    userPrompt: "Make one sentence about going to the market.",
    mistakeTip: "Do not say “I went market”. Say “I went to the market”.",
    usage: "Use this word when talking about buying things.",
    wordFamily: ["market", "buy", "vegetables", "price", "shopkeeper"],
    category: "Daily Life",
  },
  {
    word: "Buy",
    hindi: "खरीदना",
    bengali: "কেনা",
    english: "To get something by paying money.",
    simpleMeaning: "To take something after paying money.",
    example: "I want to buy vegetables.",
    nativeStyle: "I want to buy some fresh vegetables today.",
    userPrompt: "Make one sentence using the word buy.",
    mistakeTip: "After “buy”, say the object clearly: buy food, buy vegetables.",
    usage: "Use this word when you purchase something.",
    wordFamily: ["buy", "food", "vegetables", "ticket", "medicine"],
    category: "Market",
  },
  {
    word: "Office",
    hindi: "दफ़्तर / ऑफिस",
    bengali: "অফিস",
    english: "A place where people work.",
    simpleMeaning: "A place for work.",
    example: "I go to the office every day.",
    nativeStyle: "I go to the office every morning by bus.",
    userPrompt: "Make one sentence about your office or workplace.",
    mistakeTip: "Say “go to the office”, not “go office”.",
    usage: "Use this word when talking about a workplace.",
    wordFamily: ["office", "work", "manager", "team", "morning"],
    category: "Work",
  },
  {
    word: "Ticket",
    hindi: "टिकट",
    bengali: "টিকিট",
    english: "A pass for travel, movie, or entry.",
    simpleMeaning: "A paper or digital pass for travel or entry.",
    example: "I booked a train ticket.",
    nativeStyle: "I booked a train ticket for tomorrow morning.",
    userPrompt: "Make one sentence about buying or booking a ticket.",
    mistakeTip: "Use “booked a ticket” or “bought a ticket”.",
    usage: "Use this word for bus, train, movie, or entry.",
    wordFamily: ["ticket", "train", "bus", "booked", "travel"],
    category: "Travel",
  },
];

function buildDefaultResult(word: VocabWord): ResultData {
  return {
    score: 0,
    confidenceScore: 0,
    fluencyScore: 0,
    speakingScore: 0,
    word: word.word,
    userSentence: "",
    betterSentence: word.nativeStyle,
    mistake: word.mistakeTip,
    coachTip: "Use the word in a full sentence, then say it aloud.",
    repeatSentence: word.nativeStyle,
    usedBackend: false,
  };
}

function buildFallbackResult(word: VocabWord, sentence: string): ResultData {
  const usedWord = sentence.toLowerCase().includes(word.word.toLowerCase());
  const score = usedWord ? 78 : 62;

  return {
    score,
    confidenceScore: usedWord ? 74 : 62,
    fluencyScore: usedWord ? 72 : 60,
    speakingScore: usedWord ? 76 : 62,
    word: word.word,
    userSentence: sentence,
    betterSentence: word.nativeStyle,
    mistake: usedWord
      ? "Good. Now make the sentence more natural and complete."
      : word.mistakeTip,
    coachTip:
      "Local fallback result used. Repeat the better sentence slowly and clearly.",
    repeatSentence: word.nativeStyle,
    usedBackend: false,
  };
}

function mapBackendResult(
  selectedWord: VocabWord,
  sentence: string,
  backendResult: AnalyzeApiResponse
): ResultData {
  const backendScore =
    typeof backendResult.score === "number" &&
    !Number.isNaN(backendResult.score)
      ? backendResult.score
      : 78;

  const betterSentence =
    backendResult.correctedText ||
    backendResult.improved ||
    backendResult.repeatSentence ||
    selectedWord.nativeStyle;

  const mistake =
    Array.isArray(backendResult.mistakes) && backendResult.mistakes.length > 0
      ? backendResult.mistakes.join(", ")
      : "No major mistake found. Try to use this word naturally in a full sentence.";

  return {
    score: backendScore,
    confidenceScore:
      typeof backendResult.confidenceScore === "number"
        ? backendResult.confidenceScore
        : Math.min(backendScore + 2, 100),
    fluencyScore:
      typeof backendResult.fluencyScore === "number"
        ? backendResult.fluencyScore
        : Math.max(backendScore - 4, 0),
    speakingScore:
      typeof backendResult.pronunciationScore === "number"
        ? backendResult.pronunciationScore
        : backendScore,
    word: selectedWord.word,
    userSentence: backendResult.originalText || sentence,
    betterSentence,
    mistake,
    coachTip:
      backendResult.smartSuggestion ||
      backendResult.coachReply ||
      backendResult.simpleExplanation ||
      "Good. Now repeat the better sentence and try to use this word naturally in real conversation.",
    repeatSentence: backendResult.repeatSentence || betterSentence,
    usedBackend: true,
  };
}

export default function VocabularyScreen() {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const [selectedCategory, setSelectedCategory] = useState("Daily Life");
  const [selectedWord, setSelectedWord] = useState<VocabWord>(words[0]);
  const [typedSentence, setTypedSentence] = useState("");
  const [practiceState, setPracticeState] = useState<PracticeState>("idle");
  const [repeatState, setRepeatState] = useState<RepeatState>("idle");
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [resultData, setResultData] = useState<ResultData>(
    buildDefaultResult(words[0])
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
          console.log("Failed to load Vocabulary settings:", error);
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

  const filteredWords = words.filter(
    (item) => item.category === selectedCategory
  );

  const getMeaning = (word: VocabWord) => {
    if (displayLanguage === "Bengali") return word.bengali;
    if (displayLanguage === "Hindi") return word.hindi;
    return word.english;
  };

  const speakText = (text: string) => {
    if (!text.trim()) return;

    Speech.stop();
    Speech.speak(text, {
      language: "en-US",
      rate: 0.82,
    });
  };

  const chooseCategory = (category: string) => {
    setSelectedCategory(category);

    const firstWord = words.find((item) => item.category === category);

    if (firstWord) {
      chooseWord(firstWord);
    }
  };

  const chooseWord = (word: VocabWord) => {
    Speech.stop();
    setSelectedWord(word);
    setTypedSentence("");
    setPracticeState("idle");
    setRepeatState("idle");
    setShowResultPopup(false);
    setResultData(buildDefaultResult(word));
  };

  const addWordToSentence = (word: string) => {
    setTypedSentence((prev) => {
      const clean = prev.trim();
      if (!clean) return word;
      return `${clean} ${word}`;
    });

    setPracticeState("idle");
    setRepeatState("idle");
  };

  const resetPractice = () => {
    Speech.stop();
    setTypedSentence("");
    setPracticeState("idle");
    setRepeatState("idle");
    setShowResultPopup(false);
    setResultData(buildDefaultResult(selectedWord));
  };

  const saveVocabularyPractice = async (data: ResultData) => {
    try {
      await addActivity({
        type: "vocabulary",
        title: "Vocabulary practice",
        detail: `Practiced word: ${data.word} — ${data.userSentence}`,
        score: data.score,
        confidence: data.confidenceScore,
        fluency: data.fluencyScore,
        mistake: data.mistake,
        correctedSentence: data.betterSentence,
      });
    } catch (error) {
      console.log("Failed to save Vocabulary activity:", error);
    }
  };

  const checkVocabularySentence = async (sentence: string) => {
    try {
      const backendResult = await analyzeSentenceWithBackend(sentence);
      const mappedResult = mapBackendResult(
        selectedWord,
        sentence,
        backendResult
      );

      setResultData(mappedResult);
      await saveVocabularyPractice(mappedResult);
      return mappedResult;
    } catch (error) {
      console.log("Vocabulary backend fallback:", error);

      const fallbackResult = buildFallbackResult(selectedWord, sentence);

      setResultData(fallbackResult);
      await saveVocabularyPractice(fallbackResult);
      return fallbackResult;
    }
  };

  const handleSpeakAction = async () => {
    if (repeatState === "recording") {
      const repeatSentence = resultData.repeatSentence || resultData.betterSentence;

      setRepeatState("saved");

      try {
        await addActivity({
          type: "vocabulary",
          title: "Vocabulary repeat practice",
          detail: `Repeated: ${repeatSentence}`,
          score: Math.min(resultData.score + 6, 100),
          confidence: Math.min(resultData.confidenceScore + 6, 100),
          fluency: Math.min(resultData.fluencyScore + 6, 100),
          mistake: resultData.mistake,
          correctedSentence: repeatSentence,
        });
      } catch (error) {
        console.log("Failed to save Vocabulary repeat:", error);
      }

      return;
    }

    if (repeatState === "saved") {
      setRepeatState("idle");
      setPracticeState("idle");
      return;
    }

    if (practiceState === "idle" || practiceState === "checked") {
      setPracticeState("recording");
      return;
    }

    const finalSentence =
      typedSentence.trim() || `I want to use ${selectedWord.word}.`;

    await checkVocabularySentence(finalSentence);

    setPracticeState("checked");
    setShowResultPopup(true);
  };

  const startRepeatFromPopup = () => {
    setShowResultPopup(false);
    setPracticeState("idle");
    setRepeatState("recording");
  };

  const getSpeakButtonText = () => {
    if (repeatState === "recording") return "Save Repeat";
    if (repeatState === "saved") return "Practice Again";
    if (practiceState === "recording") return "Stop & Check";
    if (practiceState === "checked") return "Practice Again";
    return "Speak";
  };

  const getSpeakButtonIcon = (): keyof typeof Ionicons.glyphMap => {
    if (repeatState === "recording") return "checkmark-outline";
    if (repeatState === "saved") return "refresh-outline";
    if (practiceState === "recording") return "stop";
    if (practiceState === "checked") return "refresh-outline";
    return "mic-outline";
  };

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Vocabulary</Text>

          <View style={styles.emptyBox} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choose Topic</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
          bounces={false}
          overScrollMode="never"
        >
          {categories.map((category) => {
            const active = selectedCategory === category.title;

            return (
              <TouchableOpacity
                key={category.title}
                style={[styles.categoryCard, active && styles.categoryCardActive]}
                onPress={() => chooseCategory(category.title)}
                activeOpacity={0.85}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text
                  style={[
                    styles.categoryTitle,
                    active && styles.categoryTitleActive,
                  ]}
                >
                  {category.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.wordCard}>
          <View style={styles.wordTopRow}>
            <View style={styles.wordTitleBox}>
              <Text style={styles.wordLabel}>Today’s Word</Text>
              <Text style={styles.wordTitle}>{selectedWord.word}</Text>
            </View>

            <TouchableOpacity
              style={styles.soundButton}
              onPress={() => speakText(selectedWord.word)}
              activeOpacity={0.85}
            >
              <Ionicons name="volume-high" size={22} color={ACTION_COLOR} />
            </TouchableOpacity>
          </View>

          <Text style={styles.blockHeading}>Meaning:</Text>
          <View style={styles.meaningHeader}>
            <Text style={styles.meaningText}>{getMeaning(selectedWord)}</Text>

            <View style={styles.languagePill}>
              <Text style={styles.languagePillText}>{languageModeLabel}</Text>
            </View>
          </View>

          <Text style={styles.simpleMeaning}>
            Simple: {selectedWord.simpleMeaning}
          </Text>

          <Text style={styles.blockHeading}>Example:</Text>
          <Text style={styles.exampleText}>{selectedWord.example}</Text>

          <Text style={styles.blockHeading}>Use:</Text>
          <Text style={styles.usageText}>{selectedWord.usage}</Text>

          <Text style={styles.blockHeading}>Word Family:</Text>
          <View style={styles.wordFamilyWrap}>
            {selectedWord.wordFamily.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.familyChip}
                onPress={() => addWordToSentence(item)}
                activeOpacity={0.85}
              >
                <Text style={styles.familyChipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.practiceCard}>
          <Text style={styles.practiceTitle}>Use the Word</Text>
          <Text style={styles.practiceText}>{selectedWord.userPrompt}</Text>

          <TextInput
            style={styles.typingBox}
            value={typedSentence}
            onChangeText={(text) => {
              setTypedSentence(text);
              setPracticeState("idle");
              setRepeatState("idle");
            }}
            placeholder={`Type your sentence with "${selectedWord.word}"...`}
            placeholderTextColor="#94A3B8"
            multiline
            autoCapitalize="sentences"
          />

          <View style={styles.correctPreviewBox}>
            <Text style={styles.correctPreviewLabel}>Better sentence preview</Text>
            <Text style={styles.correctPreviewText}>
              {selectedWord.nativeStyle}
            </Text>
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
                  ? "Say your sentence clearly."
                  : repeatState === "saved"
                  ? "Repeat practice was saved to Progress."
                  : practiceState === "checked"
                  ? "Open popup to review your result."
                  : "Type, listen, then speak your sentence."}
              </Text>
            </View>
          </View>

          {repeatState === "saved" && (
            <View style={styles.savedBox}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <Text style={styles.savedText}>
                Vocabulary repeat practice saved to Progress.
              </Text>
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.listenButton}
              onPress={() => speakText(resultData.repeatSentence)}
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
                styles.speakButton,
                isRecording && styles.speakButtonRecording,
              ]}
              onPress={handleSpeakAction}
              activeOpacity={0.85}
            >
              <Ionicons name={getSpeakButtonIcon()} size={18} color="#FFFFFF" />
              <Text style={styles.speakButtonText}>{getSpeakButtonText()}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetPractice}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh-outline" size={18} color="#334155" />
            <Text style={styles.resetButtonText}>Reset Practice</Text>
          </TouchableOpacity>

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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>More Words in {selectedCategory}</Text>
        </View>

        <View style={styles.wordList}>
          {filteredWords.map((item) => {
            const active = selectedWord.word === item.word;

            return (
              <TouchableOpacity
                key={item.word}
                style={[styles.wordListCard, active && styles.wordListCardActive]}
                onPress={() => chooseWord(item)}
                activeOpacity={0.85}
              >
                <View style={styles.wordListIcon}>
                  <Ionicons name="text-outline" size={20} color={ACTION_COLOR} />
                </View>

                <View style={styles.wordListTextBox}>
                  <Text style={styles.wordListTitle}>{item.word}</Text>
                  <Text numberOfLines={1} style={styles.wordListSubtitle}>
                    {getMeaning(item)}
                  </Text>
                </View>

                {active && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={ACTION_COLOR}
                  />
                )}
              </TouchableOpacity>
            );
          })}
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
                <Text style={styles.modalLabel}>Vocabulary Result</Text>
                <Text style={styles.modalTitle}>Word practice checked</Text>
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
              bounces={false}
              overScrollMode="never"
            >
              <View style={styles.scoreGrid}>
                <View style={styles.scoreMiniBox}>
                  <Text style={styles.scoreValue}>{resultData.fluencyScore}%</Text>
                  <Text style={styles.scoreLabel}>Fluency</Text>
                </View>

                <View style={styles.scoreMiniBox}>
                  <Text style={styles.scoreValue}>
                    {resultData.confidenceScore}%
                  </Text>
                  <Text style={styles.scoreLabel}>Confidence</Text>
                </View>

                <View style={styles.scoreMiniBox}>
                  <Text style={styles.scoreValue}>
                    {resultData.speakingScore}%
                  </Text>
                  <Text style={styles.scoreLabel}>Speaking</Text>
                </View>
              </View>

              {!resultData.usedBackend && (
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

              <View style={styles.resultBox}>
                <Text style={styles.resultLabel}>Word practiced</Text>
                <Text style={styles.resultWord}>{resultData.word}</Text>
              </View>

              <View style={styles.userAnswerBox}>
                <Text style={styles.userAnswerLabel}>Your sentence</Text>
                <Text style={styles.userAnswerText}>
                  {resultData.userSentence || "No sentence added"}
                </Text>
              </View>

              <View style={styles.correctBox}>
                <Text style={styles.correctLabel}>Better sentence</Text>
                <Text style={styles.correctText}>{resultData.betterSentence}</Text>

                <TouchableOpacity
                  style={styles.modalSmallButton}
                  onPress={() => speakText(resultData.betterSentence)}
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
                  <Text style={styles.modalInfoTitle}>Mistake / Focus</Text>
                </View>

                <Text style={styles.modalInfoText}>{resultData.mistake}</Text>
              </View>

              <View style={styles.coachBox}>
                <View style={styles.modalInfoTopRow}>
                  <MaterialCommunityIcons
                    name="robot-happy-outline"
                    size={22}
                    color={ACTION_COLOR}
                  />
                  <Text style={styles.modalInfoTitle}>AI Response</Text>
                </View>

                <Text style={styles.modalInfoText}>{resultData.coachTip}</Text>
              </View>

              <View style={styles.modalRepeatBox}>
                <View style={styles.modalRepeatTopRow}>
                  <View style={styles.modalRepeatIcon}>
                    <Ionicons name="mic-outline" size={23} color={ACTION_COLOR} />
                  </View>

                  <View style={styles.modalRepeatTextBox}>
                    <Text style={styles.modalRepeatTitle}>Repeat It</Text>
                    <Text style={styles.modalRepeatSubtitle}>
                      Repeat the better sentence to remember this word in real
                      speaking.
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

  categoryRow: {
    gap: 10,
    paddingRight: 18,
    marginBottom: 18,
  },

  categoryCard: {
    minWidth: 104,
    height: 68,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  categoryCardActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  categoryEmoji: {
    fontSize: 21,
    marginBottom: 4,
  },

  categoryTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#334155",
  },

  categoryTitleActive: {
    color: ACTION_COLOR,
  },

  wordCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  wordTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  wordTitleBox: {
    flex: 1,
    paddingRight: 10,
  },

  wordLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "800",
    marginBottom: 4,
  },

  wordTitle: {
    fontSize: 36,
    color: "#0F172A",
    fontWeight: "900",
  },

  soundButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  blockHeading: {
    fontSize: 14,
    color: ACTION_COLOR,
    fontWeight: "900",
    marginTop: 14,
    marginBottom: 6,
  },

  meaningHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  meaningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
    fontWeight: "800",
  },

  languagePill: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  languagePillText: {
    color: ACTION_COLOR,
    fontSize: 11,
    fontWeight: "900",
  },

  simpleMeaning: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    fontWeight: "700",
  },

  exampleText: {
    fontSize: 17,
    lineHeight: 25,
    color: "#0F172A",
    fontWeight: "900",
  },

  usageText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#334155",
    fontWeight: "700",
  },

  wordFamilyWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  familyChip: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },

  familyChipText: {
    color: ACTION_COLOR,
    fontSize: 12,
    fontWeight: "900",
  },

  practiceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  practiceTitle: {
    fontSize: 20,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 5,
  },

  practiceText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    fontWeight: "700",
    marginBottom: 12,
  },

  typingBox: {
    minHeight: 86,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    padding: 14,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "800",
    color: "#0F172A",
    textAlignVertical: "top",
  },

  correctPreviewBox: {
    marginTop: 13,
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
    fontSize: 15,
    lineHeight: 23,
    color: "#166534",
    fontWeight: "900",
  },

  recordBox: {
    marginTop: 13,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },

  recordBoxActive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },

  micCircle: {
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

  actionRow: {
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

  speakButton: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  speakButtonRecording: {
    backgroundColor: RECORDING_COLOR,
  },

  speakButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 7,
  },

  resetButton: {
    marginTop: 10,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  resetButtonText: {
    marginLeft: 7,
    fontSize: 13,
    color: "#334155",
    fontWeight: "900",
  },

  openResultButton: {
    marginTop: 10,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  openResultText: {
    marginLeft: 7,
    fontSize: 13,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  wordList: {
    marginBottom: 18,
  },

  wordListCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  wordListCardActive: {
    borderColor: "#C7D2FE",
    backgroundColor: "#EEF2FF",
  },

  wordListIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  wordListTextBox: {
    flex: 1,
    paddingRight: 8,
  },

  wordListTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },

  wordListSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
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

  resultBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },

  resultLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "900",
    marginBottom: 5,
  },

  resultWord: {
    fontSize: 24,
    color: "#0F172A",
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