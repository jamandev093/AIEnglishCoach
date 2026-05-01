import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../config/api";

type Feedback = {
  score: number;
  mistakes: string[];
  corrections: string[];
  improved: string;
};

const SpeakingScreen = () => {
  const [userText, setUserText] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔥 BACKEND API CALL
  const sendTextToBackend = async (text: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      return await res.json();
    } catch (error) {
      console.log("API ERROR:", error);
      return null;
    }
  };

  // 🎯 HANDLE ANALYZE
  const handleAnalyze = async () => {
    if (!userText.trim()) return;

    setLoading(true);
    setFeedback(null);

    const data = await sendTextToBackend(userText);

    if (data) {
      setFeedback({
        score: data.score,
        mistakes: data.mistakes || [],
        corrections: data.corrections || [],
        improved: data.improved,
      });
    }

    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>AI Speaking Practice</Text>

      <TextInput
        style={styles.input}
        placeholder="Type your sentence..."
        value={userText}
        onChangeText={setUserText}
      />

      <TouchableOpacity style={styles.button} onPress={handleAnalyze}>
        <Text style={styles.buttonText}>Analyze</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" />}

      {feedback && (
        <View style={styles.result}>
          <Text style={styles.score}>Score: {feedback.score}</Text>

          <Text style={styles.section}>❌ Mistakes:</Text>
          {feedback.mistakes.length === 0 ? (
            <Text>No mistakes 🎉</Text>
          ) : (
            feedback.mistakes.map((m, i) => <Text key={i}>• {m}</Text>)
          )}

          <Text style={styles.section}>✔ Improved:</Text>
          <Text>{feedback.improved}</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default SpeakingScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#635BFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  result: {
    marginTop: 20,
    backgroundColor: "#f3f3f3",
    padding: 15,
    borderRadius: 10,
  },
  score: {
    fontSize: 18,
    fontWeight: "bold",
  },
  section: {
    marginTop: 10,
    fontWeight: "bold",
  },
});
