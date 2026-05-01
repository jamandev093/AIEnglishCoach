import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";
import { useLearningMode } from "../src/hooks/useLearningMode";
import { updateProgress } from "../src/utils/progressSystem";
import { updateAnalytics } from "@/src/utils/analyticsSystem";
import BackButton from "../src/components/BackButton";

export default function TestScreen() {
  const mode = useLearningMode();

  const [selected, setSelected] = useState("");
  const [result, setResult] = useState("");
  const [score, setScore] = useState(0);

  if (!mode) return null;

  let question = "";
  let options: string[] = [];
  let correct = "";

  // 🔥 Adaptive Logic
  if (mode.difficulty === "easy") {
    question = "Choose correct sentence:";
    options = [
      "I eats apple",
      "I eat apple",
      "I eating apple",
    ];
    correct = "I eat apple";
  }

  if (mode.difficulty === "medium") {
    question = "Fill correct tense:";
    options = [
      "She is go to school",
      "She goes to school",
      "She going school",
    ];
    correct = "She goes to school";
  }

  if (mode.difficulty === "hard") {
    question = "Choose correct sentence:";
    options = [
      "He have been working",
      "He has been working",
      "He is been working",
    ];
    correct = "He has been working";
  }

  const checkAnswer = async() => {
    if (selected === correct) {
      setResult("✅ Correct");
      setScore(score + 1);
    } else {
      setResult("❌ Wrong");
    }

    await updateAnalytics("test", score ); // or your score logic
  };

  const reset = () => {
    setSelected("");
    setResult("");
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Test</Text>

      <Text style={styles.question}>{question}</Text>

      {/* Options */}
      {options.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.option,
            selected === item && styles.selected,
          ]}
          onPress={() => setSelected(item)}
        >
          <Text>{item}</Text>
        </TouchableOpacity>
      ))}

      {/* Hint for beginner */}
      {mode.useNativeHelp && (
        <Text style={styles.hint}>
          Hint: Think about correct verb form
        </Text>
      )}

      {/* Buttons */}
      <TouchableOpacity style={styles.btn} onPress={checkAnswer}>
        <Text style={styles.btnText}>Submit</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resetBtn} onPress={reset}>
        <Text style={styles.btnText}>Next</Text>
      </TouchableOpacity>

      {/* Result */}
      <Text style={styles.result}>{result}</Text>

      {/* Score */}
      <Text style={styles.score}>Score: {score}</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },

  question: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },

  option: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
    borderRadius: 6,
  },

  selected: {
    backgroundColor: "#ddd",
  },

  hint: {
    marginTop: 10,
    color: "green",
    textAlign: "center",
  },

  btn: {
    marginTop: 20,
    backgroundColor: "black",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },

  resetBtn: {
    marginTop: 10,
    backgroundColor: "gray",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },

  btnText: {
    color: "white",
  },

  result: {
    marginTop: 15,
    fontSize: 18,
    textAlign: "center",
  },

  score: {
    marginTop: 10,
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
  },
});