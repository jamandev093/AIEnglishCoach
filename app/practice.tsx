import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";
import { useLearningMode } from "../src/hooks/useLearningMode";
import { updateProgress } from "../src/utils/progressSystem";
import { updateAnalytics } from "@/src/utils/analyticsSystem";
import BackButton from "../src/components/BackButton";

export default function PracticeScreen() {
  
  const mode = useLearningMode();

  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState("");
  const [index, setIndex] = useState(0);

  if (!mode) return null;

  // 🔥 Practice questions (adaptive)
  const questionsEasy = [
    { q: "Translate: सेब", a: "apple" },
    { q: "Translate: मैं खाता हूँ", a: "I eat" },
  ];

  const questionsMedium = [
    { q: "Make sentence: (she / eat / apple)", a: "She eats apple" },
    { q: "Translate: वह स्कूल जाती है", a: "She goes to school" },
  ];

  const questionsHard = [
    { q: "Correct sentence: He go to work", a: "He goes to work" },
    { q: "Make sentence: (they / work / all day)", a: "They work all day" },
  ];

  let questions = questionsEasy;

  if (mode.difficulty === "medium") questions = questionsMedium;
  if (mode.difficulty === "hard") questions = questionsHard;

  const current = questions[index];

  const checkAnswer = async() => {
    if (answer.toLowerCase().trim() === current.a.toLowerCase()) {
      setResult("✅ Correct");
    } else {
      setResult(`❌ Correct: ${current.a}`);
    }

    await updateAnalytics("practice", 8); // or your score logic
  };

  const next = () => {
    setAnswer("");
    setResult("");
    setIndex((index + 1) % questions.length);
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Practice</Text>

      <Text style={styles.question}>{current.q}</Text>

      {/* Hint (only for beginner) */}
      {mode.useNativeHelp && (
        <Text style={styles.hint}>Hint: Think in simple English</Text>
      )}

      {/* Answer Display */}
      <View style={styles.answerBox}>
        <Text style={styles.answerText}>
          {answer || "Tap words below"}
        </Text>
      </View>

      {/* Word Buttons */}
      <View style={styles.wordsContainer}>
        {current.a.split(" ").map((word, i) => (
          <TouchableOpacity
            key={i}
            style={styles.wordBtn}
            onPress={() => setAnswer(answer + " " + word)}
          >
            <Text>{word}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Buttons */}
      <TouchableOpacity style={styles.btn} onPress={checkAnswer}>
        <Text style={styles.btnText}>Check</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.nextBtn} onPress={next}>
        <Text style={styles.btnText}>Next</Text>
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

  hint: {
    color: "green",
    textAlign: "center",
    marginBottom: 10,
  },

  answerBox: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
  },

  answerText: {
    fontSize: 16,
  },

  wordsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  wordBtn: {
    backgroundColor: "#eee",
    padding: 8,
    margin: 5,
    borderRadius: 5,
  },

  btn: {
    marginTop: 20,
    backgroundColor: "black",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },

  nextBtn: {
    marginTop: 10,
    backgroundColor: "gray",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },

  btnText: {
    color: "white",
  },

  result: {
    marginTop: 15,
    textAlign: "center",
    fontSize: 18,
  },
});
