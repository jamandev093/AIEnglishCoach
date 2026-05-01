import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLearningMode } from "../src/hooks/useLearningMode";
import * as Speech from "expo-speech";
import { updateAnalytics } from "@/src/utils/analyticsSystem";
import BackButton from "../src/components/BackButton";

export default function ReadingListeningScreen() {
  const mode = useLearningMode();

  if (!mode) return null;

  let sentence = "";
  let meaning = "";
  let tip = "";

  // 🔥 Adaptive Logic
  if (mode.difficulty === "easy") {
    sentence = "I am going to school.";
    meaning = "मैं स्कूल जा रहा हूँ।";
    tip = "Simple present continuous sentence.";
  }

  if (mode.difficulty === "medium") {
    sentence = "She is preparing for her exams.";
    meaning = "She is getting ready for exams.";
    tip = "Focus on verb usage.";
  }

  if (mode.difficulty === "hard") {
    sentence = "He has been working tirelessly throughout the day.";
    meaning = "";
    tip = "Understand from context.";
  }

  const speakSentence = async () => {
    Speech.speak(sentence, {
      language: "en-US",
      rate: 0.9,
    });
    await updateAnalytics("reading", 8);
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Reading & Listening</Text>

      {/* Sentence */}
      <Text style={styles.sentence}>{sentence}</Text>

      {/* 🔊 Play Audio */}
      <TouchableOpacity style={styles.listenBtn} onPress={speakSentence}>
        <Text style={styles.btnText}>🔊 Listen</Text>
      </TouchableOpacity>

      {/* Meaning (only if allowed) */}
      {mode.useNativeHelp && meaning !== "" && (
        <Text style={styles.meaning}>{meaning}</Text>
      )}

      {/* Tip */}
      <Text style={styles.tip}>{tip}</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },

  sentence: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
  },

  listenBtn: {
    backgroundColor: "black",
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },

  btnText: {
    color: "white",
    fontSize: 16,
  },

  meaning: {
    fontSize: 18,
    color: "green",
    marginBottom: 10,
    textAlign: "center",
  },

  tip: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
});