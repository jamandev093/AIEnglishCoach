import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type FeatureCard = {
  title: string;
  subtitle: string;
  iconType: "ion" | "material";
  icon: string;
  score: string;
  progress: number;
  backgroundColor: string;
  route: string;
};

type TopicItem = {
  title: string;
  emoji: string;
  subtitle: string;
};

const ACTION_COLOR = "#8499DC";

const features: FeatureCard[] = [
  {
    title: "Pronunciation",
    subtitle: "Speak clearly",
    iconType: "ion",
    icon: "mic-outline",
    score: "58%",
    progress: 58,
    backgroundColor: "#EEF2FF",
    route: "/pronunciations",
  },
  {
    title: "Vocabulary",
    subtitle: "Use words in sentences",
    iconType: "ion",
    icon: "book-outline",
    score: "66%",
    progress: 66,
    backgroundColor: "#ECFDF5",
    route: "/vocabulary",
  },
  {
    title: "Grammar",
    subtitle: "Fix speaking mistakes",
    iconType: "material",
    icon: "school-outline",
    score: "70%",
    progress: 70,
    backgroundColor: "#FDF2F8",
    route: "/grammar",
  },
  {
    title: "Reading & Listening",
    subtitle: "Understand and speak",
    iconType: "ion",
    icon: "headset-outline",
    score: "64%",
    progress: 64,
    backgroundColor: "#EFF6FF",
    route: "/readingListening",
  },
  {
    title: "Sentence Building",
    subtitle: "Make correct sentences",
    iconType: "ion",
    icon: "create-outline",
    score: "60%",
    progress: 60,
    backgroundColor: "#ECFEFF",
    route: "/sentencesBuilding",
  },
  {
    title: "Stories",
    subtitle: "Speak from pictures",
    iconType: "ion",
    icon: "images-outline",
    score: "62%",
    progress: 62,
    backgroundColor: "#FFF7ED",
    route: "/stories",
  },
];

const topics: TopicItem[] = [
  {
    title: "Morning",
    emoji: "🌅",
    subtitle: "Daily routine",
  },
  {
    title: "Market",
    emoji: "🛒",
    subtitle: "Shopping talk",
  },
  {
    title: "School",
    emoji: "🎒",
    subtitle: "Classroom life",
  },
  {
    title: "Hospital",
    emoji: "🏥",
    subtitle: "Doctor visit",
  },
  {
    title: "Travel",
    emoji: "✈️",
    subtitle: "Trips & tickets",
  },
  {
    title: "Office",
    emoji: "💼",
    subtitle: "Work speaking",
  },
  {
    title: "Restaurant",
    emoji: "🍽️",
    subtitle: "Food ordering",
  },
  {
    title: "Bus Stop",
    emoji: "🚌",
    subtitle: "Public travel",
  },
  {
    title: "Interview",
    emoji: "🧑‍💼",
    subtitle: "Job answers",
  },
  {
    title: "Friends",
    emoji: "👥",
    subtitle: "Casual chat",
  },
  {
    title: "Phone Call",
    emoji: "📞",
    subtitle: "Call practice",
  },
  {
    title: "Tourist Place",
    emoji: "🗺️",
    subtitle: "Ask & explain",
  },
];

export default function HomeScreen() {
  const openRoute = (route: string) => {
    router.push(route as any);
  };

    const openSpeakingTopic = (topic: TopicItem) => {
  router.push({
    pathname: "/topicSpeaking",
    params: {
      topic: topic.title,
    },
  } as any);
  };

  const renderFeatureIcon = (feature: FeatureCard) => {
    if (feature.iconType === "material") {
      return (
        <MaterialCommunityIcons
          name={feature.icon as any}
          size={24}
          color={ACTION_COLOR}
        />
      );
    }

    return <Ionicons name={feature.icon as any} size={24} color={ACTION_COLOR} />;
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome */}
      <View style={styles.welcomeBox}>
        <Text style={styles.welcomeText}>Welcome back 👋</Text>
        <Text style={styles.appTitle}>AI English Coach</Text>
      </View>

      {/* Compact Today's Mission */}
      <TouchableOpacity
        style={styles.compactActionCard}
        activeOpacity={0.86}
        onPress={() => router.push("/speaking")}
      >
        <View style={styles.compactIconBox}>
          <Ionicons name="mic-outline" size={24} color={ACTION_COLOR} />
        </View>

        <View style={styles.compactTextBox}>
          <Text style={styles.compactTitle}>Today’s Speaking Mission</Text>
          <Text style={styles.compactSubtitle}>
            Speak 2 minutes about your morning.
          </Text>

          <View style={styles.compactBadgeRow}>
            <View style={styles.compactBadge}>
              <Text style={styles.compactBadgeText}>🔥 Day 1</Text>
            </View>

            <View style={styles.compactBadge}>
              <Text style={styles.compactBadgeText}>Easy Mode</Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
      </TouchableOpacity>

      {/* Compact Confidence Card */}
      <TouchableOpacity
        style={styles.compactConfidenceCard}
        activeOpacity={0.86}
        onPress={() => router.push("/confidenceBuilding" as any)}
      >
        <View style={styles.compactTopRow}>
          <View style={styles.compactIconBox}>
            <Ionicons name="trending-up-outline" size={24} color={ACTION_COLOR} />
          </View>

          <View style={styles.compactTextBox}>
            <Text style={styles.compactTitle}>Start Building Confidence</Text>
            <Text style={styles.compactSubtitle}>
              Continue confidence and fluency practice.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
        </View>

        <View style={styles.compactStatsRow}>
          <View style={styles.compactStatItem}>
            <Text style={styles.compactStatValue}>62%</Text>
            <Text style={styles.compactStatLabel}>Confidence</Text>
          </View>

          <View style={styles.compactDivider} />

          <View style={styles.compactStatItem}>
            <Text style={styles.compactStatValue}>64%</Text>
            <Text style={styles.compactStatLabel}>Fluency</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Topics Section Header */}
      <TouchableOpacity
        style={styles.topicSectionHeader}
        activeOpacity={0.86}
        onPress={() => router.push("/topics" as any)}
      >
        <View style={styles.topicSectionTextBox}>
          <Text style={styles.sectionTitle}>Practice Topics</Text>
          <Text style={styles.sectionSubtitle}>
            Choose real-life situations for speaking practice.
          </Text>
        </View>

        <View style={styles.topicArrowButton}>
          <Ionicons name="chevron-forward" size={23} color={ACTION_COLOR} />
        </View>
      </TouchableOpacity>

      {/* Horizontal Topic Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.topicRow}
      >
        {topics.map((topic) => (
          <TouchableOpacity
            key={topic.title}
            style={styles.topicCard}
            activeOpacity={0.86}
            onPress={() => openSpeakingTopic(topic)}
          >
            <Text style={styles.topicEmoji}>{topic.emoji}</Text>
            <Text style={styles.topicTitle}>{topic.title}</Text>
            <Text style={styles.topicSubtitle}>{topic.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Feature Cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Build Real Speaking Skill</Text>
      </View>

      <View style={styles.featureGrid}>
        {features.map((feature) => (
          <TouchableOpacity
            key={feature.title}
            style={[
              styles.featureCard,
              { backgroundColor: feature.backgroundColor },
            ]}
            activeOpacity={0.86}
            onPress={() => openRoute(feature.route)}
          >
            <View style={styles.featureTopRow}>
              <View style={styles.featureIconCircle}>
                {renderFeatureIcon(feature)}
              </View>

              <View style={styles.scorePill}>
                <Text style={styles.scoreText}>{feature.score}</Text>
              </View>
            </View>

            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${feature.progress}%` },
                ]}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 120,
  },

  welcomeBox: {
    marginBottom: 16,
  },

  welcomeText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 8,
  },

  appTitle: {
    fontSize: 30,
    lineHeight: 36,
    color: "#0F172A",
    fontWeight: "900",
  },

  compactActionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  compactConfidenceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  compactTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  compactIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  compactTextBox: {
    flex: 1,
  },

  compactTitle: {
    fontSize: 16,
    lineHeight: 21,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 3,
  },

  compactSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: "#64748B",
    fontWeight: "700",
  },

  compactBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 7,
  },

  compactBadge: {
    minHeight: 25,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  compactBadgeText: {
    fontSize: 11,
    color: "#334155",
    fontWeight: "900",
  },

  compactStatsRow: {
    marginTop: 11,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  compactStatItem: {
    flex: 1,
    alignItems: "center",
  },

  compactStatValue: {
    fontSize: 20,
    color: ACTION_COLOR,
    fontWeight: "900",
    marginBottom: 2,
  },

  compactStatLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "900",
  },

  compactDivider: {
    width: 1,
    height: 34,
    backgroundColor: "#E5E7EB",
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 21,
    lineHeight: 27,
    color: "#0F172A",
    fontWeight: "900",
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  topicSectionHeader: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  topicSectionTextBox: {
    flex: 1,
    paddingRight: 12,
  },

  topicArrowButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  topicRow: {
    gap: 10,
    paddingRight: 18,
    marginBottom: 20,
  },

  topicCard: {
    width: 132,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  topicEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },

  topicTitle: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 4,
  },

  topicSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: "#64748B",
    fontWeight: "700",
  },

  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },

  featureCard: {
    width: "48%",
    minHeight: 154,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  featureTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  featureIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  scorePill: {
    minWidth: 48,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  scoreText: {
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  featureTitle: {
    fontSize: 16,
    lineHeight: 21,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 6,
  },

  featureSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: "#64748B",
    fontWeight: "800",
    minHeight: 34,
  },

  progressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.78)",
    overflow: "hidden",
    marginTop: 12,
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: ACTION_COLOR,
  },

  bottomSpace: {
    height: 24,
  },
});