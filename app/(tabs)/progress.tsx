import { View, Text, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import BackButton from "../../src/components/BackButton";
import {
  getAnalytics,
  calculateInsights,
  generateSuggestions,
  generateDailyPlan,
} from "../../src/utils/analyticsSystem";

export default function ProgressScreen() {
  const [insights, setInsights] = useState<any>({
    strengths: [],
    weaknesses: [],
    improvement: [],
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [dailyPlan, setDailyPlan] = useState<string[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const data = await getAnalytics();

    const result = calculateInsights(data);
    setInsights(result);

    const sug = generateSuggestions(result);
    setSuggestions(sug);

    const plan = generateDailyPlan(result);
    setDailyPlan(plan);
  };

  return (
    <View style={styles.container}>
       <BackButton />
      <Text style={styles.title}>Your Learning Insights</Text>

      {/* 💪 Strengths */}
      <View style={styles.card}>
        <Text style={styles.label}>💪 Strengths</Text>
        <Text style={styles.text}>
          {insights.strengths.length > 0
            ? insights.strengths.join(", ")
            : "No data yet"}
        </Text>
      </View>

      {/* ⚠ Improvement */}
      <View style={styles.card}>
        <Text style={styles.label}>⚠ Needs Improvement</Text>
        <Text style={styles.text}>
          {insights.improvement.length > 0
            ? insights.improvement.join(", ")
            : "No data yet"}
        </Text>
      </View>

      {/* ❌ Weak Areas */}
      <View style={styles.card}>
        <Text style={styles.label}>❌ Weak Areas</Text>
        <Text style={styles.text}>
          {insights.weaknesses.length > 0
            ? insights.weaknesses.join(", ")
            : "No data yet"}
        </Text>
      </View>

      {/* 🧠 Suggestions */}
      <View style={styles.card}>
        <Text style={styles.label}>🧠 Smart Suggestions</Text>

        {suggestions.length > 0 ? (
          suggestions.map((item, index) => (
            <Text key={index} style={styles.text}>
              {item}
            </Text>
          ))
        ) : (
          <Text style={styles.text}>No suggestions yet</Text>
        )}
      </View>

      {/* 📅 Daily Plan */}
      <View style={styles.card}>
        <Text style={styles.label}>📅 Today's Plan</Text>

        {dailyPlan.length > 0 ? (
          dailyPlan.map((item, index) => (
            <Text key={index} style={styles.text}>
              {item}
            </Text>
          ))
        ) : (
          <Text style={styles.text}>No plan yet</Text>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#f3f3f3",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },

  label: {
    fontSize: 14,
    color: "#777",
    marginBottom: 5,
  },

  text: {
    fontSize: 16,
    marginBottom: 5,
  },
});