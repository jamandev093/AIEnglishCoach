import { View, Text, StyleSheet } from "react-native";
import { useLearningMode } from "../src/hooks/useLearningMode";
import {
  getAnalytics,
  calculateInsights,
  getAdaptiveLevel,
} from "../src/utils/analyticsSystem";
import { useEffect, useState } from "react";
import BackButton from "../src/components/BackButton";

type LevelType = "easy" | "medium" | "hard";

export default function GrammarScreen() {
  const [level, setLevel] = useState<LevelType>("medium");
  const mode = useLearningMode();

  // ✅ FIX: hooks must be before any return
  useEffect(() => {
    loadLevel();
  }, []);

  const loadLevel = async () => {
    const data = await getAnalytics();
    const insights = calculateInsights(data);
    const lvl = getAdaptiveLevel(insights, "grammar") as LevelType;
    setLevel(lvl);
  };

  if (!mode) return null;

  // ✅ Typed object
  const topics: Record<LevelType, {
    topic: string;
    explanation: string;
    example: string;
  }> = {
    easy: {
      topic: "Present Simple",
      explanation: "Use for daily actions (रोज़ की आदत)",
      example: "I eat food every day.",
    },
    medium: {
      topic: "Present Continuous",
      explanation: "Used for actions happening now",
      example: "She is studying right now.",
    },
    hard: {
      topic: "Present Perfect Continuous",
      explanation: "Used for actions that started in past and continue",
      example: "He has been working for 5 hours.",
    },
  };

  const current = topics[level];

  return (
    <View style={{ flex: 1 }}>
      <BackButton />

      <View style={styles.container}>
        <Text style={styles.title}>Grammar</Text>

        <Text style={styles.topic}>{current.topic}</Text>
        <Text style={styles.explanation}>{current.explanation}</Text>
        <Text style={styles.example}>{current.example}</Text>

        {!mode.useNativeHelp && (
          <Text style={styles.note}>
            Learn grammar through usage and context
          </Text>
        )}
      </View>
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

  topic: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },

  explanation: {
    fontSize: 18,
    color: "green",
    textAlign: "center",
    marginBottom: 10,
  },

  example: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 10,
  },

  note: {
    fontSize: 14,
    color: "red",
    textAlign: "center",
  },
});