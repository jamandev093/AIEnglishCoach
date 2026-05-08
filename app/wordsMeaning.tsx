import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { addActivity } from "../src/utils/activityHistory";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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


type PracticeState = "idle" | "listening" | "checked";

type MeaningUse = {
  title: string;
  englishMeaning: string;
  hindiMeaning: string;
  bengaliMeaning: string;
  example: string;
  simpleNote: string;
};

type WordData = {
  word: string;
  pronunciation: string;
  level: string;
  shortEnglishMeaning: string;
  uses: MeaningUse[];
  phrases: string[];
};

const ACTION_COLOR = "#8499DC";

const wordBank: WordData[] = [
  {
    word: "Run",
    pronunciation: "/rʌn/",
    level: "Common word",
    shortEnglishMeaning: "Run can mean move fast, operate, or manage something.",
    uses: [
      {
        title: "Move fast",
        englishMeaning: "To move quickly using your legs.",
        hindiMeaning: "दौड़ना",
        bengaliMeaning: "দৌড়ানো",
        example: "I run every morning.",
        simpleNote: "Use this when a person or animal moves fast.",
      },
      {
        title: "Operate",
        englishMeaning: "When a machine, app, or system is working.",
        hindiMeaning: "चलना / चलाना",
        bengaliMeaning: "চলা / চালানো",
        example: "The app runs smoothly.",
        simpleNote: "Use this when something works properly.",
      },
      {
        title: "Manage",
        englishMeaning: "To control or manage a business or activity.",
        hindiMeaning: "संचालित करना",
        bengaliMeaning: "পরিচালনা করা",
        example: "She runs a small shop.",
        simpleNote: "Use this when someone manages something.",
      },
    ],
    phrases: ["run fast", "run an app", "run a shop", "run every day"],
  },
  {
    word: "Get",
    pronunciation: "/ɡet/",
    level: "Very common word",
    shortEnglishMeaning:
      "Get has many meanings: receive, become, understand, or arrive.",
    uses: [
      {
        title: "Receive",
        englishMeaning: "To receive something.",
        hindiMeaning: "पाना / प्राप्त करना",
        bengaliMeaning: "পাওয়া",
        example: "I got a message.",
        simpleNote: "Use this when something comes to you.",
      },
      {
        title: "Become",
        englishMeaning: "To become a certain condition.",
        hindiMeaning: "हो जाना",
        bengaliMeaning: "হয়ে যাওয়া",
        example: "I got tired.",
        simpleNote: "Use this when your condition changes.",
      },
      {
        title: "Understand",
        englishMeaning: "To understand something.",
        hindiMeaning: "समझना",
        bengaliMeaning: "বোঝা",
        example: "I got your point.",
        simpleNote: "Use this when you understand someone.",
      },
    ],
    phrases: ["get ready", "get tired", "get a message", "get your point"],
  },
  {
    word: "Take",
    pronunciation: "/teɪk/",
    level: "Common speaking word",
    shortEnglishMeaning:
      "Take can mean carry, accept, use, or need some time.",
    uses: [
      {
        title: "Carry",
        englishMeaning: "To carry something with you.",
        hindiMeaning: "ले जाना",
        bengaliMeaning: "নিয়ে যাওয়া",
        example: "Take your bag.",
        simpleNote: "Use this when carrying something.",
      },
      {
        title: "Use transport",
        englishMeaning: "To use a bus, train, taxi, or flight.",
        hindiMeaning: "लेना",
        bengaliMeaning: "নেওয়া",
        example: "I take the bus to work.",
        simpleNote: "Use this when talking about transport.",
      },
      {
        title: "Need time",
        englishMeaning: "To need time to finish something.",
        hindiMeaning: "समय लगना",
        bengaliMeaning: "সময় লাগা",
        example: "It takes ten minutes.",
        simpleNote: "Use this when talking about required time.",
      },
    ],
    phrases: ["take a bus", "take time", "take care", "take your bag"],
  },
];

const comingSoonItems = [
  "AI meaning for any searched word",
  "English-Only Practice Mode support",
  "Meaning inside full sentence",
  "Confusing word comparison",
  "Saved searched words history",
  "AI teacher feedback after speaking",
];

export default function WordsMeaningScreen() {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [searchText, setSearchText] = useState("Run");
  const [selectedWord, setSelectedWord] = useState<WordData>(wordBank[0]);
  const [selectedUseIndex, setSelectedUseIndex] = useState(0);
  const [practiceState, setPracticeState] = useState<PracticeState>("idle");

  const selectedUse = selectedWord.uses[selectedUseIndex];

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
    };

    loadProfileAndSettings();
  }, [])
);

  useEffect(() => {
    if (practiceState !== "listening") {
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
  }, [practiceState, pulseAnim, barOne, barTwo, barThree, barFour]);

  const speakText = (text: string) => {
    Speech.stop();
    Speech.speak(text, {
      language: "en-US",
      rate: 0.82,
    });
  };

  const displayLanguage = getDisplayLanguage(profile, settings);
const languageModeLabel = getLanguageModeLabel(profile, settings);

  const getMeaning = (item: MeaningUse) => {
  if (displayLanguage === "Bengali") return item.bengaliMeaning;
  if (displayLanguage === "Hindi") return item.hindiMeaning;
  return item.englishMeaning;
};

  const handleSearch = () => {
    const cleanText = searchText.trim().toLowerCase();

    if (!cleanText) return;

    const foundWord = wordBank.find(
      (item) => item.word.toLowerCase() === cleanText
    );

    if (foundWord) {
      setSelectedWord(foundWord);
      setSelectedUseIndex(0);
      setPracticeState("idle");
      return;
    }

    setSelectedWord({
      word: searchText.trim(),
      pronunciation: "Coming soon",
      level: "New word",
      shortEnglishMeaning: "AI meaning search will explain this word later.",
      uses: [
        {
          title: "Meaning coming soon",
          englishMeaning:
            "This word is not in the local word bank yet. AI dictionary support will be connected later.",
          hindiMeaning: "यह अर्थ बाद में जोड़ा जाएगा।",
          bengaliMeaning: "এই অর্থ পরে যোগ করা হবে।",
          example: `I want to use the word ${searchText.trim()} in a sentence.`,
          simpleNote:
            "Later, AI will explain any searched word with examples.",
        },
      ],
      phrases: ["AI meaning coming soon"],
    });

    setSelectedUseIndex(0);
    setPracticeState("idle");
  };

    const handlePracticePress = async () => {
  if (practiceState === "idle") {
    setPracticeState("listening");
    return;
  }

  if (practiceState === "listening") {
    setPracticeState("checked");

    await addActivity({
      type: "wordsMeaning",
      title: "Words meaning practice",
      detail: `Practiced word: ${selectedWord.word} — ${selectedUse.example}`,
      score: 70,
      confidence: 62,
      fluency: 60,
      correctedSentence: selectedUse.example,
    });

    return;
  }

  setPracticeState("idle");
};

  const practiceButtonText =
    practiceState === "idle"
      ? "Start Speaking"
      : practiceState === "listening"
      ? "Stop & Check"
      : "Try Again";

  const practiceButtonIcon =
    practiceState === "idle"
      ? "mic-outline"
      : practiceState === "listening"
      ? "stop"
      : "refresh-outline";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Words Meaning</Text>

        <View style={styles.emptyBox} />
      </View>

      {/* Search */}
      <View style={styles.searchCard}>
        <Text style={styles.sectionTitle}>Search Word</Text>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Try: Run, Get, Take"
            placeholderTextColor="#94A3B8"
          />

          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.searchHint}>
          See how one English word changes meaning in real sentences.
        </Text>
      </View>

      {/* Word Summary */}
      <View style={styles.wordCard}>
        <View style={styles.wordTopRow}>
          <View style={styles.wordTitleBox}>
            <Text style={styles.wordLabel}>Selected Word</Text>
            <Text style={styles.wordTitle}>{selectedWord.word}</Text>
            <Text style={styles.pronunciation}>{selectedWord.pronunciation}</Text>
          </View>

          <TouchableOpacity
            style={styles.soundButton}
            onPress={() => speakText(selectedWord.word)}
          >
            <Ionicons name="volume-high" size={22} color={ACTION_COLOR} />
          </TouchableOpacity>
        </View>

        <View style={styles.pillRow}>
          <View style={styles.softPill}>
            <Ionicons name="sparkles-outline" size={14} color={ACTION_COLOR} />
            <Text style={styles.softPillText}>{selectedWord.level}</Text>
          </View>

          <View style={styles.whitePill}>
            <Text style={styles.whitePillText}>{languageModeLabel}</Text>
          </View>
        </View>

        <Text style={styles.shortMeaning}>
          {selectedWord.shortEnglishMeaning}
        </Text>
      </View>

      {/* Meaning Uses */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Meaning by Context</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.useTabs}
      >
        {selectedWord.uses.map((item, index) => {
          const active = selectedUseIndex === index;

          return (
            <TouchableOpacity
              key={item.title}
              style={[styles.useTab, active && styles.useTabActive]}
              onPress={() => {
                setSelectedUseIndex(index);
                setPracticeState("idle");
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.useTabText, active && styles.useTabTextActive]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Meaning Detail */}
      <View style={styles.detailCard}>
        <View style={styles.detailTopRow}>
          <View style={styles.detailTitleBox}>
            <Text style={styles.detailLabel}>This meaning</Text>
            <Text style={styles.detailTitle}>{selectedUse.title}</Text>
          </View>

          <TouchableOpacity
            style={styles.smallSoundButton}
            onPress={() => speakText(selectedUse.example)}
          >
            <Ionicons name="volume-high-outline" size={21} color={ACTION_COLOR} />
          </TouchableOpacity>
        </View>

        <View style={styles.meaningBox}>
          <View style={styles.meaningHeader}>
            <Text style={styles.meaningLabel}>Meaning</Text>
            <Text style={styles.meaningLanguage}>{languageModeLabel}</Text>
          </View>

          <Text style={styles.meaningText}>{getMeaning(selectedUse)}</Text>
        </View>

        <View style={styles.exampleBox}>
          <View style={styles.exampleTopRow}>
            <Text style={styles.exampleLabel}>Example</Text>

            <TouchableOpacity onPress={() => speakText(selectedUse.example)}>
              <Ionicons
                name="volume-high-outline"
                size={20}
                color={ACTION_COLOR}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.exampleText}>{selectedUse.example}</Text>
        </View>

        <View style={styles.noteBox}>
          <MaterialCommunityIcons
            name="lightbulb-on-outline"
            size={21}
            color={ACTION_COLOR}
          />
          <Text style={styles.noteText}>{selectedUse.simpleNote}</Text>
        </View>
      </View>

      {/* Common Phrases */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Common Phrases</Text>
      </View>

      <View style={styles.phraseList}>
        {selectedWord.phrases.map((phrase) => (
          <TouchableOpacity
            key={phrase}
            style={styles.phraseCard}
            onPress={() => speakText(phrase)}
            activeOpacity={0.85}
          >
            <View style={styles.phraseIcon}>
              <Ionicons name="chatbox-outline" size={20} color={ACTION_COLOR} />
            </View>

            <Text style={styles.phraseText}>{phrase}</Text>

            <Ionicons name="volume-high-outline" size={19} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Speaking Practice */}
      <View style={styles.practiceSpeakCard}>
        <View style={styles.practiceSpeakTopRow}>
          <View>
            <Text style={styles.practiceSpeakTitle}>Use in Speaking</Text>
            <Text style={styles.practiceSpeakSubtitle}>
              Practice this meaning in a real sentence.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.practiceListenButton}
            onPress={() => speakText(selectedUse.example)}
          >
            <Ionicons name="volume-high" size={21} color={ACTION_COLOR} />
          </TouchableOpacity>
        </View>

        <View style={styles.sayBox}>
          <Text style={styles.sayLabel}>Say this first</Text>
          <Text style={styles.sayText}>{selectedUse.example}</Text>
        </View>

        <View
          style={[
            styles.recordingArea,
            practiceState === "listening" && styles.recordingAreaActive,
          ]}
        >
          <Animated.View
            style={[
              styles.micCircle,
              practiceState === "listening" && {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Ionicons
              name={practiceState === "listening" ? "mic" : "mic-outline"}
              size={27}
              color={practiceState === "listening" ? "#FFFFFF" : ACTION_COLOR}
            />
          </Animated.View>

          <View style={styles.waveBox}>
            <Animated.View style={[styles.waveBar, { height: barOne }]} />
            <Animated.View style={[styles.waveBar, { height: barTwo }]} />
            <Animated.View style={[styles.waveBar, { height: barThree }]} />
            <Animated.View style={[styles.waveBar, { height: barFour }]} />
          </View>

          <Text style={styles.recordingTitle}>
            {practiceState === "idle"
              ? "Ready to speak"
              : practiceState === "listening"
              ? "Listening..."
              : "Practice checked"}
          </Text>

          <Text style={styles.recordingSubtitle}>
            {practiceState === "idle"
              ? "Listen once, then speak the example."
              : practiceState === "listening"
              ? "Speak naturally and clearly."
              : "AI teacher feedback will appear here later."}
          </Text>

          <View style={styles.practiceActionRow}>
            <TouchableOpacity
              style={styles.listenButton}
              onPress={() => speakText(selectedUse.example)}
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
                practiceState === "listening" && styles.speakButtonActive,
              ]}
              onPress={handlePracticePress}
              activeOpacity={0.85}
            >
              <Ionicons name={practiceButtonIcon} size={18} color="#FFFFFF" />
              <Text style={styles.speakButtonText}>{practiceButtonText}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {practiceState === "checked" && (
          <View style={styles.resultBox}>
            <View style={styles.resultTopRow}>
              <Text style={styles.resultTitle}>Practice Result</Text>
              <Text style={styles.resultScore}>Good start</Text>
            </View>

            <Text style={styles.resultText}>
               Good practice. This word meaning activity was saved to Progress. AI context
               checking will be added later.
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
              Words Meaning will become an AI context dictionary.
            </Text>
          </View>
        </View>

        <View style={styles.futureList}>
          {comingSoonItems.map((item) => (
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
      </View>
    </ScrollView>
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
    marginTop: 2,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },

  searchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },

  searchRow: {
    flexDirection: "row",
    gap: 10,
  },

  searchInput: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

  searchButton: {
    width: 52,
    height: 50,
    borderRadius: 15,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },

  searchHint: {
    marginTop: 10,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
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
    marginBottom: 3,
  },

  wordTitle: {
    fontSize: 42,
    color: "#0F172A",
    fontWeight: "900",
  },

  pronunciation: {
    marginTop: 2,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "700",
  },

  soundButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  pillRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },

  softPill: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
  },

  softPillText: {
    marginLeft: 6,
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  whitePill: {
    backgroundColor: "#F8FAFC",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  whitePillText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "900",
  },

  shortMeaning: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 21,
    color: "#334155",
    fontWeight: "700",
  },

  useTabs: {
    gap: 10,
    paddingRight: 18,
    marginBottom: 16,
  },

  useTab: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  useTabActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  useTabText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "900",
  },

  useTabTextActive: {
    color: ACTION_COLOR,
  },

  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  detailTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  detailTitleBox: {
    flex: 1,
    paddingRight: 10,
  },

  detailLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "800",
    marginBottom: 4,
  },

  detailTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#0F172A",
  },

  smallSoundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
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

  meaningHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  meaningLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: ACTION_COLOR,
  },

  meaningLanguage: {
    fontSize: 11,
    fontWeight: "900",
    color: "#64748B",
  },

  meaningText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#334155",
    fontWeight: "800",
  },

  exampleBox: {
    marginTop: 12,
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },

  exampleTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  exampleLabel: {
    fontSize: 13,
    color: ACTION_COLOR,
    fontWeight: "900",
    marginBottom: 6,
  },

  exampleText: {
    fontSize: 17,
    lineHeight: 25,
    color: "#0F172A",
    fontWeight: "900",
  },

  noteBox: {
    marginTop: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  noteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#334155",
    fontWeight: "700",
  },

  phraseList: {
    marginBottom: 18,
  },

  phraseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  phraseIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  phraseText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },

  practiceSpeakCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  practiceSpeakTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  practiceSpeakTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },

  practiceSpeakSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 19,
    fontWeight: "600",
  },

  practiceListenButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  sayBox: {
    marginTop: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sayLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "900",
    marginBottom: 5,
  },

  sayText: {
    fontSize: 17,
    lineHeight: 25,
    color: "#0F172A",
    fontWeight: "900",
  },

  recordingArea: {
    marginTop: 14,
    borderRadius: 22,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 15,
    alignItems: "center",
    overflow: "hidden",
  },

  recordingAreaActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  micCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },

  waveBox: {
    height: 42,
    width: 116,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginBottom: 10,
    overflow: "hidden",
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
    marginBottom: 3,
  },

  recordingSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 19,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 13,
  },

  practiceActionRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },

  listenButton: {
    flex: 1,
    height: 47,
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
    height: 47,
    borderRadius: 15,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  speakButtonActive: {
    backgroundColor: "#111827",
  },

  speakButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 7,
  },

  resultBox: {
    marginTop: 13,
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },

  resultTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  resultTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#166534",
  },

  resultScore: {
    fontSize: 13,
    fontWeight: "900",
    color: "#166534",
  },

  resultText: {
    fontSize: 13,
    color: "#166534",
    lineHeight: 20,
    fontWeight: "700",
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

  futureList: {
    gap: 9,
  },

  futureItemRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  futureItemText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#334155",
    fontWeight: "700",
  },
});