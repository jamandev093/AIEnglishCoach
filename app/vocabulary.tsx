import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";
import { useLearningMode } from "../src/hooks/useLearningMode";
import { updateAnalytics } from "@/src/utils/analyticsSystem";
import BackButton from "../src/components/BackButton";

export default function VocabularyScreen() {
  
  const mode = useLearningMode();

  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState(false);

  if (!mode) return null;

  // 🔥 Word sets
  const easyWords = [
    {
      word: "Apple",
      meaning: "सेब (A fruit)",
      example: "I eat an apple every day.",
      tip: "Simple everyday word",
    },
    {
      word: "Book",
      meaning: "किताब",
      example: "She reads a book.",
      tip: "Used in daily life",
    },
  ];

  const mediumWords = [
    {
      word: "Opportunity",
      meaning: "A chance to do something",
      example: "This job is a great opportunity.",
      tip: "Use in formal conversation",
    },
    {
      word: "Improve",
      meaning: "To get better",
      example: "Practice helps you improve.",
      tip: "Common learning word",
    },
  ];

  const hardWords = [
    {
      word: "Meticulous",
      meaning: "Showing attention to detail",
      example: "She is meticulous in her work.",
      tip: "Used in professional context",
    },
    {
      word: "Resilient",
      meaning: "Able to recover quickly",
      example: "He is resilient after failure.",
      tip: "Advanced personality word",
    },
  ];

  let words = easyWords;

  if (mode.difficulty === "medium") words = mediumWords;
  if (mode.difficulty === "hard") words = hardWords;

  const current = words[index];

  const nextWord = async() => {
    setIndex((index + 1) % words.length);
    setSaved(false);
    await updateAnalytics("vocabulary", 7);
  };

  const saveWord = () => {
    setSaved(true);
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Vocabulary</Text>

      {/* Word */}
      <Text style={styles.word}>{current.word}</Text>

      {/* Meaning */}
      {mode.useNativeHelp && (
        <Text style={styles.meaning}>{current.meaning}</Text>
      )}

      {/* Example */}
      <Text style={styles.example}>{current.example}</Text>

      {/* Tip */}
      <Text style={styles.tip}>{current.tip}</Text>

      {/* Save */}
      <TouchableOpacity style={styles.saveBtn} onPress={saveWord}>
        <Text style={styles.btnText}>
          {saved ? "⭐ Saved" : "Save Word"}
        </Text>
      </TouchableOpacity>

      {/* Next */}
      <TouchableOpacity style={styles.nextBtn} onPress={nextWord}>
        <Text style={styles.btnText}>Next Word</Text>
      </TouchableOpacity>

      {/* Pro mode message */}
      {!mode.useNativeHelp && (
        <Text style={styles.challenge}>
          Learn meaning from context only
        </Text>
      )}

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

  word: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
  },

  meaning: {
    fontSize: 18,
    color: "green",
    marginBottom: 10,
    textAlign: "center",
  },

  example: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 10,
  },

  tip: {
    fontSize: 14,
    color: "#777",
    marginBottom: 15,
  },

  saveBtn: {
    backgroundColor: "#000",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },

  nextBtn: {
    backgroundColor: "gray",
    padding: 10,
    borderRadius: 5,
  },

  btnText: {
    color: "white",
  },

  challenge: {
    marginTop: 15,
    color: "red",
    textAlign: "center",
  },
});