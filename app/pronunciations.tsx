import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLearningMode } from "../src/hooks/useLearningMode";
import BackButton from "../src/components/BackButton";

export default function PronunciationScreen() {
 
  const mode = useLearningMode();

  if (!mode) return null;

  return (
    <View style={styles.container}>
       <BackButton />
      <Text style={styles.title}>Pronunciation Practice</Text>

      {/* WORD */}
      <Text style={styles.word}>Communication</Text>

      {/* 🔥 Adaptive Help */}
      {mode.useNativeHelp && (
        <Text style={styles.help}>
          हिंदी: संचार (Communication)
        </Text>
      )}

      {/* 🔥 Difficulty based hints */}
      {mode.difficulty === "easy" && (
        <Text style={styles.tip}>
          Tip: Break word into parts → Com-mu-ni-ca-tion
        </Text>
      )}

      {mode.difficulty === "medium" && (
        <Text style={styles.tip}>
          Tip: Focus on stress → commuNIcation
        </Text>
      )}

      {mode.difficulty === "hard" && (
        <Text style={styles.challenge}>
          Speak naturally without hints
        </Text>
      )}

      {/* BUTTON */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Start Speaking</Text>
      </TouchableOpacity>

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
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },

  help: {
    fontSize: 16,
    color: "green",
    marginBottom: 10,
  },

  tip: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
  },

  challenge: {
    fontSize: 16,
    color: "red",
    marginBottom: 10,
  },

  button: {
    marginTop: 20,
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 6,
  },

  buttonText: {
    color: "#fff",
  },
});