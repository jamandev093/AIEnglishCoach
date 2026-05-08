import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type TopicLevel = "Easy" | "Medium" | "Real Life";
type TopicCategory = "All" | "Daily" | "Travel" | "Work" | "Emergency";

type TopicItem = {
  title: string;
  emoji: string;
  subtitle: string;
  level: TopicLevel;
  category: Exclude<TopicCategory, "All">;
  mission: string;
  starter: string;
};

const ACTION_COLOR = "#8499DC";

const categories: TopicCategory[] = [
  "All",
  "Daily",
  "Travel",
  "Work",
  "Emergency",
];

const topics: TopicItem[] = [
  {
    title: "Morning Routine",
    emoji: "🌅",
    subtitle: "Talk about your daily morning",
    level: "Easy",
    category: "Daily",
    mission: "Speak 3 sentences about what you do every morning.",
    starter: "Every morning, I...",
  },
  {
    title: "Market Visit",
    emoji: "🛒",
    subtitle: "Shopping and price conversation",
    level: "Easy",
    category: "Daily",
    mission: "Practice buying something and asking the price.",
    starter: "I want to buy...",
  },
  {
    title: "School Day",
    emoji: "🎒",
    subtitle: "Classroom and student life",
    level: "Easy",
    category: "Daily",
    mission: "Describe your school or class routine.",
    starter: "Today at school, I...",
  },
  {
    title: "Hospital Visit",
    emoji: "🏥",
    subtitle: "Doctor, symptoms, medicine",
    level: "Real Life",
    category: "Emergency",
    mission: "Explain a health problem to a doctor.",
    starter: "Doctor, I have...",
  },
  {
    title: "Travel",
    emoji: "✈️",
    subtitle: "Tickets, journey, directions",
    level: "Medium",
    category: "Travel",
    mission: "Talk about a journey or ask for travel help.",
    starter: "I want to go to...",
  },
  {
    title: "Office Work",
    emoji: "💼",
    subtitle: "Workplace speaking practice",
    level: "Medium",
    category: "Work",
    mission: "Introduce your work and explain one task.",
    starter: "I work as...",
  },
  {
    title: "Restaurant",
    emoji: "🍽️",
    subtitle: "Ordering food politely",
    level: "Easy",
    category: "Daily",
    mission: "Order food and ask simple questions.",
    starter: "I would like to order...",
  },
  {
    title: "Bus Stop",
    emoji: "🚌",
    subtitle: "Public transport conversation",
    level: "Real Life",
    category: "Travel",
    mission: "Ask where the bus goes and when it arrives.",
    starter: "Does this bus go to...",
  },
  {
    title: "Job Interview",
    emoji: "🧑‍💼",
    subtitle: "Answer common interview questions",
    level: "Medium",
    category: "Work",
    mission: "Introduce yourself confidently.",
    starter: "My name is...",
  },
  {
    title: "Friends Talk",
    emoji: "👥",
    subtitle: "Casual daily conversation",
    level: "Easy",
    category: "Daily",
    mission: "Talk about your day with a friend.",
    starter: "Today, I...",
  },
  {
    title: "Phone Call",
    emoji: "📞",
    subtitle: "Speak clearly on calls",
    level: "Real Life",
    category: "Work",
    mission: "Practice a short phone conversation.",
    starter: "Hello, I am calling about...",
  },
  {
    title: "Tourist Place",
    emoji: "🗺️",
    subtitle: "Ask and explain directions",
    level: "Medium",
    category: "Travel",
    mission: "Describe a place or ask how to go there.",
    starter: "Can you tell me how to go to...",
  },
  {
    title: "Family Talk",
    emoji: "🏠",
    subtitle: "Home and family conversation",
    level: "Easy",
    category: "Daily",
    mission: "Talk about your family in simple English.",
    starter: "There are...",
  },
  {
    title: "Bank Visit",
    emoji: "🏦",
    subtitle: "Money and account conversation",
    level: "Real Life",
    category: "Work",
    mission: "Ask for help at a bank counter.",
    starter: "I need help with...",
  },
  {
    title: "Emergency Help",
    emoji: "🚨",
    subtitle: "Ask for urgent help",
    level: "Real Life",
    category: "Emergency",
    mission: "Practice asking for help calmly.",
    starter: "Please help me...",
  },
];

export default function TopicsScreen() {
  const [selectedCategory, setSelectedCategory] =
    useState<TopicCategory>("All");

  const filteredTopics = useMemo(() => {
    if (selectedCategory === "All") return topics;

    return topics.filter((topic) => topic.category === selectedCategory);
  }, [selectedCategory]);

  const openSpeakingTopic = (topic: TopicItem) => {
    router.push({
      pathname: "/topicSpeaking",
      params: {
        topic: topic.title,
        mission: topic.mission,
        starter: topic.starter,
        level: topic.level,
      },
    } as any);
  };

  const getLevelStyle = (level: TopicLevel) => {
    if (level === "Easy") return styles.easyLevel;
    if (level === "Medium") return styles.mediumLevel;
    return styles.realLifeLevel;
  };

  const getLevelTextStyle = (level: TopicLevel) => {
    if (level === "Easy") return styles.easyLevelText;
    if (level === "Medium") return styles.mediumLevelText;
    return styles.realLifeLevelText;
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Practice Topics</Text>

        <View style={styles.emptyBox} />
      </View>

      {/* Compact Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons name="chatbubbles-outline" size={24} color={ACTION_COLOR} />
        </View>

        <View style={styles.summaryTextBox}>
          <Text style={styles.summaryTitle}>Choose a real situation</Text>
          <Text style={styles.summaryText}>
            Pick a topic and start speaking practice instantly.
          </Text>
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {categories.map((category) => {
          const active = selectedCategory === category;

          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                active && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  active && styles.categoryChipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Topic List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === "All"
            ? "All Speaking Topics"
            : `${selectedCategory} Topics`}
        </Text>

        <Text style={styles.sectionSubtitle}>
          {filteredTopics.length} topics available
        </Text>
      </View>

      <View style={styles.topicList}>
        {filteredTopics.map((topic) => (
          <TouchableOpacity
            key={topic.title}
            style={styles.topicCard}
            activeOpacity={0.86}
            onPress={() => openSpeakingTopic(topic)}
          >
            <View style={styles.topicLeft}>
              <View style={styles.topicEmojiBox}>
                <Text style={styles.topicEmoji}>{topic.emoji}</Text>
              </View>
            </View>

            <View style={styles.topicMiddle}>
              <View style={styles.topicTitleRow}>
                <Text numberOfLines={1} style={styles.topicTitle}>
                  {topic.title}
                </Text>

                <View style={[styles.levelPill, getLevelStyle(topic.level)]}>
                  <Text
                    style={[
                      styles.levelPillText,
                      getLevelTextStyle(topic.level),
                    ]}
                  >
                    {topic.level}
                  </Text>
                </View>
              </View>

              <Text numberOfLines={1} style={styles.topicSubtitle}>
                {topic.subtitle}
              </Text>

              <View style={styles.missionBox}>
                <Text style={styles.missionLabel}>Mission</Text>
                <Text style={styles.missionText}>{topic.mission}</Text>
              </View>

              <View style={styles.starterBox}>
                <Text style={styles.starterLabel}>Starter:</Text>
                <Text numberOfLines={1} style={styles.starterText}>
                  {topic.starter}
                </Text>
              </View>
            </View>

            <View style={styles.arrowBox}>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={ACTION_COLOR}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 18,
    paddingBottom: 110,
  },

  header: {
    marginTop: 8,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  headerTitle: {
    fontSize: 20,
    color: "#0F172A",
    fontWeight: "900",
  },

  emptyBox: {
    width: 42,
    height: 42,
  },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  summaryTextBox: {
    flex: 1,
  },

  summaryTitle: {
    fontSize: 17,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 4,
  },

  summaryText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "700",
  },

  categoryRow: {
    gap: 9,
    paddingRight: 18,
    marginBottom: 18,
  },

  categoryChip: {
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  categoryChipActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  categoryChipText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "900",
  },

  categoryChipTextActive: {
    color: ACTION_COLOR,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "700",
  },

  topicList: {
    gap: 12,
  },

  topicCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  topicLeft: {
    marginRight: 12,
  },

  topicEmojiBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  topicEmoji: {
    fontSize: 27,
  },

  topicMiddle: {
    flex: 1,
  },

  topicTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  topicTitle: {
    flex: 1,
    fontSize: 17,
    color: "#0F172A",
    fontWeight: "900",
    paddingRight: 8,
  },

  topicSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "700",
    marginBottom: 10,
  },

  levelPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
  },

  easyLevel: {
    backgroundColor: "#ECFDF5",
    borderColor: "#BBF7D0",
  },

  mediumLevel: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  realLifeLevel: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },

  levelPillText: {
    fontSize: 10,
    fontWeight: "900",
  },

  easyLevelText: {
    color: "#166534",
  },

  mediumLevelText: {
    color: ACTION_COLOR,
  },

  realLifeLevelText: {
    color: "#991B1B",
  },

  missionBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 15,
    padding: 11,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 9,
  },

  missionLabel: {
    fontSize: 10,
    color: ACTION_COLOR,
    fontWeight: "900",
    marginBottom: 4,
  },

  missionText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#334155",
    fontWeight: "700",
  },

  starterBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  starterLabel: {
    fontSize: 11,
    color: ACTION_COLOR,
    fontWeight: "900",
    marginRight: 5,
  },

  starterText: {
    flex: 1,
    fontSize: 11,
    color: "#334155",
    fontWeight: "800",
  },

  arrowBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    marginTop: 2,
  },
});