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

type PracticeState = "idle" | "recording" | "checked";

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
  word: string;
  userSentence: string;
  betterSentence: string;
  mistake: string;
  coachTip: string;
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

export default function VocabularyScreen() {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const [selectedCategory, setSelectedCategory] = useState("Daily Life");
  const [selectedWord, setSelectedWord] = useState<VocabWord>(words[0]);
  const [typedSentence, setTypedSentence] = useState("");
  const [practiceState, setPracticeState] = useState<PracticeState>("idle");
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [resultData, setResultData] = useState<ResultData>({
    score: 0,
    word: words[0].word,
    userSentence: "",
    betterSentence: words[0].nativeStyle,
    mistake: words[0].mistakeTip,
    coachTip: "Use the word in a full sentence, then say it aloud.",
  });

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barOne = useRef(new Animated.Value(12)).current;
  const barTwo = useRef(new Animated.Value(26)).current;
  const barThree = useRef(new Animated.Value(16)).current;
  const barFour = useRef(new Animated.Value(31)).current;

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
    if (practiceState !== "recording") {
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
  }, [practiceState, pulseAnim, barOne, barTwo, barThree, barFour]);

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
    setShowResultPopup(false);
    setResultData({
      score: 0,
      word: word.word,
      userSentence: "",
      betterSentence: word.nativeStyle,
      mistake: word.mistakeTip,
      coachTip: "Use the word in a full sentence, then say it aloud.",
    });
  };

  const addWordToSentence = (word: string) => {
    setTypedSentence((prev) => {
      const clean = prev.trim();
      if (!clean) return word;
      return `${clean} ${word}`;
    });

    setPracticeState("idle");
  };

  const resetPractice = () => {
    Speech.stop();
    setTypedSentence("");
    setPracticeState("idle");
    setShowResultPopup(false);
  };

  const saveVocabularyPractice = async (data: ResultData) => {
    await addActivity({
      type: "vocabulary",
      title: "Vocabulary practice",
      detail: `Practiced word: ${data.word} — ${data.userSentence}`,
      score: data.score,
      confidence: 62,
      fluency: 60,
      mistake: data.mistake,
      correctedSentence: data.betterSentence,
    });
  };

  const handleSpeakAction = async () => {
    if (practiceState === "idle" || practiceState === "checked") {
      setPracticeState("recording");
      return;
    }

    const finalSentence =
      typedSentence.trim() || `I want to use ${selectedWord.word}.`;

    const result: ResultData = {
      score: finalSentence
        .toLowerCase()
        .includes(selectedWord.word.toLowerCase())
        ? 78
        : 62,
      word: selectedWord.word,
      userSentence: finalSentence,
      betterSentence: selectedWord.nativeStyle,
      mistake: selectedWord.mistakeTip,
      coachTip:
        "Good. Now repeat the better sentence and try to use this word naturally in real conversation.",
    };

    setResultData(result);
    setPracticeState("checked");
    setShowResultPopup(true);
    await saveVocabularyPractice(result);
  };

  const startRepeatFromPopup = () => {
    setShowResultPopup(false);
    setPracticeState("recording");
  };

  const getSpeakButtonText = () => {
    if (practiceState === "recording") return "Stop & Check";
    if (practiceState === "checked") return "Practice Again";
    return "Speak";
  };

  const getSpeakButtonIcon = (): keyof typeof Ionicons.glyphMap => {
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

          <Text style={styles.headerTitle}>Vocabulary</Text>

          <View style={styles.emptyBox} />
        </View>

        {/* Topic Selector */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choose Topic</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
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

        {/* Main Vocabulary Teaching Card */}
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

        {/* Build and Speak */}
        <View style={styles.practiceCard}>
          <Text style={styles.practiceTitle}>Use the Word</Text>
          <Text style={styles.practiceText}>{selectedWord.userPrompt}</Text>

          <TextInput
            style={styles.typingBox}
            value={typedSentence}
            onChangeText={(text) => {
              setTypedSentence(text);
              setPracticeState("idle");
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
              practiceState === "recording" && styles.recordBoxActive,
            ]}
          >
            <Animated.View
              style={[
                styles.micCircle,
                practiceState === "recording" && {
                  backgroundColor: RECORDING_COLOR,
                  borderColor: RECORDING_COLOR,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Ionicons
                name={
                  practiceState === "recording"
                    ? "radio-button-on"
                    : "mic-outline"
                }
                size={28}
                color={practiceState === "recording" ? "#FFFFFF" : ACTION_COLOR}
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
                {practiceState === "recording"
                  ? "Recording..."
                  : practiceState === "checked"
                  ? "Result ready"
                  : "Ready"}
              </Text>

              <Text style={styles.statusText}>
                {practiceState === "recording"
                  ? "Say your sentence clearly."
                  : practiceState === "checked"
                  ? "Open popup to review your result."
                  : "Type, listen, then speak your sentence."}
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.listenButton}
              onPress={() => speakText(selectedWord.nativeStyle)}
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
                practiceState === "recording" && styles.speakButtonRecording,
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

        {/* More Words */}
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

      {/* Result Popup */}
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
            >
              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>Vocabulary score</Text>
                <Text style={styles.scoreValue}>{resultData.score}%</Text>
              </View>

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
                  <Text style={styles.modalInfoTitle}>Mistake Memory</Text>
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
                  <Text style={styles.modalInfoTitle}>Coach Tip</Text>
                </View>

                <Text style={styles.modalInfoText}>{resultData.coachTip}</Text>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalLightButton}
                onPress={() => speakText(resultData.betterSentence)}
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

  scoreBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  scoreLabel: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "900",
  },

  scoreValue: {
    fontSize: 15,
    color: ACTION_COLOR,
    fontWeight: "900",
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
    marginBottom: 4,
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