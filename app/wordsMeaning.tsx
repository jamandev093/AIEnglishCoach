import { View, Text, StyleSheet } from "react-native";
import { useLearningMode } from "../src/hooks/useLearningMode";
import BackButton from "../src/components/BackButton";

export default function WordsMeaningScreen() {

  const mode = useLearningMode();

  if (!mode) return null;

  let word = "";
  let meanings: string[] = [];
  let synonyms: string[] = [];
  let example = "";
  let note = "";

  // 🔥 Adaptive Logic

  if (mode.difficulty === "easy") {
    word = "Run";

    meanings = [
      "दौड़ना (to move fast)",
      "चलाना (run a machine)",
    ];

    synonyms = ["fast", "move"];

    example = "I run every morning.";

    note = "This word has more than one meaning.";
  }

  if (mode.difficulty === "medium") {
    word = "Run";

    meanings = [
      "To move quickly on foot",
      "To operate something (run a business)",
    ];

    synonyms = ["jog", "operate", "manage"];

    example = "She runs her own company.";

    note = "Understand meaning from context.";
  }

  if (mode.difficulty === "hard") {
    word = "Run";

    meanings = [
      "To function or operate",
      "To be in charge of something",
      "To flow (water runs)",
    ];

    synonyms = ["manage", "execute", "flow"];

    example = "The river runs through the valley.";

    note = "Identify meaning based on usage.";
  }

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Word Meaning</Text>

      {/* Word */}
      <Text style={styles.word}>{word}</Text>

      {/* Meanings */}
      <View style={styles.section}>
        <Text style={styles.heading}>Meanings</Text>
        {meanings.map((item, index) => (
          <Text key={index} style={styles.text}>• {item}</Text>
        ))}
      </View>

      {/* Synonyms */}
      <View style={styles.section}>
        <Text style={styles.heading}>Synonyms</Text>
        <Text style={styles.text}>{synonyms.join(", ")}</Text>
      </View>

      {/* Example */}
      <View style={styles.section}>
        <Text style={styles.heading}>Example</Text>
        <Text style={styles.text}>{example}</Text>
      </View>

      {/* Note */}
      <Text style={styles.note}>{note}</Text>

      {/* Native Help Control */}
      {!mode.useNativeHelp && (
        <Text style={styles.challenge}>
          Try understanding without translation
        </Text>
      )}

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

  word: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  section: {
    marginBottom: 15,
  },

  heading: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },

  text: {
    fontSize: 15,
    color: "#555",
  },

  note: {
    marginTop: 10,
    color: "green",
    textAlign: "center",
  },

  challenge: {
    marginTop: 10,
    color: "red",
    textAlign: "center",
  },
});