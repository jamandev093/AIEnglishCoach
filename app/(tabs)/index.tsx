import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getGoals } from "../../src/utils/dailyGoals";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../src/theme/ThemeContext";
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

export default function HomeScreen() {
  const router = useRouter();

  const [lastScreen, setLastScreen] = useState("");
 
  const [goals, setGoals] = useState({
    learn: false,
    practice: false,
    speak: false,
    understand: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const screen = await AsyncStorage.getItem("lastScreen");
    

    if (screen) setLastScreen(screen);
    

    const data = await getGoals();
    setGoals(data);
  };

   const { colors } = useTheme();
     
  // 🔥 Card Component
  const Card = ({ title, emoji, route, index }: any) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(route);
    };

    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        activeOpacity={0.8}
        onPressIn={() => (scale.value = withSpring(0.95))}
        onPressOut={() => (scale.value = withSpring(1))}
        onPress={handlePress}
      >
        <Animated.View
          entering={FadeInDown.delay(index * 80).duration(400)}
          style={[
          styles.card,
         { backgroundColor: colors.card },
         animatedStyle,
       ]}
>
       <Text style={styles.cardEmoji}>{emoji}</Text>

      <Text style={[styles.cardText, { color: colors.text }]}>
      {title}
      </Text>
      </Animated.View>
        
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
  contentContainerStyle={[
    styles.container,
    { backgroundColor: colors.background }
  ]} >

      

      {/* Greeting */}
      <Animated.Text entering={FadeIn.duration(400)} style={styles.greeting}>
        Hi 👋
      </Animated.Text>

      <Animated.Text entering={FadeIn.duration(600)} style={styles.motivation}>
        Practice Makes You Perfect!
      </Animated.Text>

      {/* 🔥 Resume + Goals */}
      <View style={styles.topBar}>

        {lastScreen !== "" && (
          <TouchableOpacity
            style={styles.resumeRow}
            onPress={() => router.push(`/${lastScreen}` as any)}
          >
            <Text style={styles.playIcon}>▶</Text>
            <Text style={styles.resumeText}>
              Continue {lastScreen}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.goalsText}>
          <Text>Today's Goals : </Text> {"\n"}
          {goals.learn ? " ✔Learn" : " ⬜Learn"} •
          {goals.practice ? " ✔Practice" : " ⬜Practice"} •
          {goals.speak ? " ✔Speak" : " ⬜Speak"} •
          {goals.understand ? " ✔Understand" : " ⬜Understand"}
        </Text>
      </View>

      {/* GRID */}
      <View style={styles.grid}>
        <Card index={0} title="Pronunciation" emoji="🔊" route="/pronunciation" />
        <Card index={1} title="Vocabulary" emoji="📘" route="/vocabulary" />
        <Card index={2} title="Words Meaning" emoji="🧠" route="/wordsMeaning" />
        <Card index={3} title="Grammar" emoji="📖" route="/grammar" />
        <Card index={4} title="Practice" emoji="✍️" route="/practice" />
        <Card index={5} title="Sentence Building" emoji="🧩" route="/sentenceBuilding" />
        <Card index={6} title="Reading & Listening" emoji="🎧" route="/readingListening" />
        <Card index={7} title="Test" emoji="📝" route="/test" />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },

  greeting: {
    fontSize: 18,
    color: "#666",
  },

  motivation: {
    fontSize: 16,
    color: "#2a9d8f",
    marginBottom: 10,
    fontWeight: "600",
  },

  topBar: {
    backgroundColor: "#f3f3f3",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },

  resumeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  playIcon: {
    fontSize: 16,
    marginRight: 5,
  },

  resumeText: {
    fontSize: 15,
    fontWeight: "600",
  },

  goalsText: {
    fontSize: 13,
    color: "#555",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  cardWrapper: {
    width: "47%",
    marginBottom: 15,
  },

  card: {
    backgroundColor: "#f8f8f8",
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    elevation: 2,
  },

  cardEmoji: {
    fontSize: 30,
    marginBottom: 10,
  },

  cardText: {
    fontSize: 15,
    fontWeight: "600",
  },
});