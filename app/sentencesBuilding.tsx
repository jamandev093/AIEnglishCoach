import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";
import { useLearningMode } from "../src/hooks/useLearningMode";
import { updateAnalytics } from "@/src/utils/analyticsSystem";
import BackButton from "../src/components/BackButton";

export default function SentenceBuildingScreen() {
  const mode = useLearningMode();

  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [result, setResult] = useState("");

  if (!mode) return null;

  let correctSentence = "";
  let words: string[] = [];
  let hint = "";

  // 🔥 Adaptive Logic
  if (mode.difficulty === "easy") {
    correctSentence = "I eat an apple";
    words = ["apple", "I", "eat", "an"];
    hint = "Subject + Verb + Object";
  }

  if (mode.difficulty === "medium") {
    correctSentence = "She is reading a book";
    words = ["book", "is", "She", "a", "reading"];
    hint = "Use correct verb form";
  }

  if (mode.difficulty === "hard") {
    correctSentence = "He has been working all day";
    words = ["working", "has", "He", "been", "day", "all"];
    hint = ""; // no hint for pro
  }

  const handleSelect = (word: string) => {
    setSelectedWords([...selectedWords, word]);
  };

  const checkAnswer = async () => {
    const sentence = selectedWords.join(" ");
    if (sentence === correctSentence) {
      setResult("✅ Correct!");
    } else {
      setResult("❌ Try Again");
    }
    await updateAnalytics("sentence", 7);
  };

  const reset = () => {
    setSelectedWords([]);
    setResult("");
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Sentence Building</Text>

      {/* Selected Words */}
      <View style={styles.output}>
        <Text style={styles.outputText}>
          {selectedWords.join(" ")}
        </Text>
      </View>

      {/* Hint */}
      {mode.useNativeHelp && hint !== "" && (
        <Text style={styles.hint}>{hint}</Text>
      )}

      {/* Words */}
      <View style={styles.wordsContainer}>
        {words.map((word, index) => (
          <TouchableOpacity
            key={index}
            style={styles.wordBtn}
            onPress={() => handleSelect(word)}
          >
            <Text style={styles.wordText}>{word}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Buttons */}
      <TouchableOpacity style={styles.checkBtn} onPress={checkAnswer}>
        <Text style={styles.btnText}>Check</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resetBtn} onPress={reset}>
        <Text style={styles.btnText}>Reset</Text>
      </TouchableOpacity>

      {/* Result */}
      <Text style={styles.result}>{result}</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },

  output: {
    minHeight: 60,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    padding: 10,
    marginBottom: 15,
  },

  outputText: {
    fontSize: 18,
  },

  hint: {
    color: "green",
    marginBottom: 15,
  },

  wordsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  wordBtn: {
    backgroundColor: "#eee",
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },

  wordText: {
    fontSize: 16,
  },

  checkBtn: {
    marginTop: 20,
    backgroundColor: "black",
    padding: 10,
    borderRadius: 5,
  },

  resetBtn: {
    marginTop: 10,
    backgroundColor: "gray",
    padding: 10,
    borderRadius: 5,
  },

  btnText: {
    color: "white",
  },

  result: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: "bold",
  },
});