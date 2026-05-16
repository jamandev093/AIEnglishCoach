import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getConversationTopicsContent,
  type ContentItem,
} from "../src/config/api";
import PremiumLockedModal from "../src/components/PremiumLockedModal";
import {
  DEFAULT_LOCAL_USER_ACCESS,
  canAccessContent,
  getAccessBadgeLabel,
  getPremiumLockMessage,
  getPremiumLockTitle,
} from "../src/utils/accessControl";
import { saveSelectedTopic } from "../src/utils/selectedTopicStore";

const ACTION_COLOR = "#8499DC";

const fallbackTopics: ContentItem[] = [
  {
    id: "topic-fallback-school",
    type: "topic",
    title: "At School",
    level: "beginner",
    category: "school",
    languageSupport: "both",
    prompt: "Practice a real conversation about school.",
    expectedResponse: "I go to school every day.",
    sentenceStarters: ["I study...", "My teacher...", "I go to school..."],
    keyWords: ["school", "teacher", "student", "study"],
    mediaUrl: null,
    isPublished: true,
    isPremium: false,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "topic-fallback-hospital",
    type: "topic",
    title: "At the Hospital",
    level: "intermediate",
    category: "health",
    languageSupport: "both",
    prompt: "Practice a real conversation with a doctor or nurse.",
    expectedResponse: "I am not feeling well. I have a fever.",
    sentenceStarters: ["I am not feeling...", "I have...", "Can you help me..."],
    keyWords: ["hospital", "doctor", "fever", "medicine"],
    mediaUrl: null,
    isPublished: true,
    isPremium: true,
    createdAt: "",
    updatedAt: "",
  },
];

function formatLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getTopicIcon(category: string) {
  const normalizedCategory = category.toLowerCase();

  if (normalizedCategory.includes("school")) return "school-outline";
  if (normalizedCategory.includes("health")) return "medkit-outline";
  if (normalizedCategory.includes("market")) return "cart-outline";
  if (normalizedCategory.includes("travel")) return "airplane-outline";
  if (normalizedCategory.includes("work")) return "briefcase-outline";

  return "chatbubbles-outline";
}

function getLevelText(level: ContentItem["level"]) {
  if (level === "advanced") return "Advanced";
  if (level === "intermediate") return "Intermediate";
  return "Beginner";
}

export default function ConversationTopicsScreen() {
  const [topics, setTopics] = useState<ContentItem[]>(fallbackTopics);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [premiumModalTitle, setPremiumModalTitle] = useState("Premium Practice");
  const [premiumModalMessage, setPremiumModalMessage] = useState(
    "This lesson is part of Premium. Payment and account access will be added soon. For now, continue with free practice."
  );

  useEffect(() => {
    let isMounted = true;

    const loadTopics = async () => {
      try {
        setLoading(true);
        setErrorText(null);

        const response = await getConversationTopicsContent();

        if (!isMounted) return;

        setTopics(response.items.length > 0 ? response.items : fallbackTopics);
      } catch (error) {
        console.log("Conversation topics fallback:", error);

        if (!isMounted) return;

        setTopics(fallbackTopics);
        setErrorText("Using saved topics while backend content loads.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTopics();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTopicPress = async (topic: ContentItem) => {
    const accessDecision = canAccessContent(
      {
        isPremium: topic.isPremium,
        title: topic.title,
      },
      DEFAULT_LOCAL_USER_ACCESS
    );

    if (!accessDecision.allowed) {
      setPremiumModalTitle(
        getPremiumLockTitle({
          isPremium: topic.isPremium,
          title: topic.title,
        })
      );
      setPremiumModalMessage(
        getPremiumLockMessage(
          {
            isPremium: topic.isPremium,
            title: topic.title,
          },
          DEFAULT_LOCAL_USER_ACCESS
        )
      );
      setPremiumModalVisible(true);
      return;
    }

    try {
      await saveSelectedTopic({
        id: topic.id,
        title: topic.title,
        type: "topic",
        level: topic.level,
        category: topic.category,
        languageSupport: topic.languageSupport,
        prompt: topic.prompt,
        expectedResponse: topic.expectedResponse ?? null,
        sentenceStarters: topic.sentenceStarters,
        keyWords: topic.keyWords,
        isPremium: topic.isPremium,
      });

      router.push("/speaking" as any);
    } catch (error) {
      console.log("Failed to save selected topic:", error);

      Alert.alert(
        "Topic Not Saved",
        "Please try again. The topic could not be prepared for speaking practice."
      );
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
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

      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Ionicons name="chatbubbles-outline" size={28} color={ACTION_COLOR} />
        </View>

        <View style={styles.heroTextBox}>
          <Text style={styles.heroTitle}>Real Conversation Practice</Text>
          <Text style={styles.heroText}>
            Choose a real-life topic. Later, each topic will open the Speaking
            coach with AI correction, repeat practice, and progress saving.
          </Text>
        </View>
      </View>

      {loading && (
        <Text style={styles.statusText}>Loading topics from backend...</Text>
      )}

      {errorText && <Text style={styles.statusText}>{errorText}</Text>}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Choose a Topic</Text>
        <Text style={styles.sectionSubtitle}>
          Topic content is admin-ready. Speaking connection comes next.
        </Text>
      </View>

      {topics.map((topic) => (
        <TouchableOpacity
          key={topic.id}
          style={styles.topicCard}
          onPress={() => handleTopicPress(topic)}
          activeOpacity={0.88}
        >
          <View style={styles.topicTopRow}>
            <View style={styles.topicIconBox}>
              <Ionicons
                name={getTopicIcon(topic.category)}
                size={24}
                color={ACTION_COLOR}
              />
            </View>

            <View style={styles.topicTitleBox}>
              <Text style={styles.topicTitle}>{topic.title}</Text>
              <Text style={styles.topicMeta}>
                {formatLabel(topic.category)} • {getLevelText(topic.level)}
              </Text>
            </View>

            {topic.isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
          </View>

          <Text style={styles.topicPrompt}>{topic.prompt}</Text>

          {topic.sentenceStarters.length > 0 && (
            <>
              <Text style={styles.blockLabel}>Sentence starters</Text>
              <View style={styles.chipWrap}>
                {topic.sentenceStarters.map((starter) => (
                  <View key={starter} style={styles.starterChip}>
                    <Text style={styles.starterChipText}>{starter}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {topic.keyWords.length > 0 && (
            <>
              <Text style={styles.blockLabel}>Key words</Text>
              <View style={styles.chipWrap}>
                {topic.keyWords.map((word) => (
                  <View key={word} style={styles.wordChip}>
                    <Text style={styles.wordChipText}>{word}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={styles.cardFooter}>
            <Text style={styles.footerText}>
                  {topic.isPremium
                    ? getAccessBadgeLabel(topic, DEFAULT_LOCAL_USER_ACCESS)
                    : "Tap to start speaking practice"}
                </Text>
            <Ionicons name="chevron-forward" size={18} color={ACTION_COLOR} />
          </View>
        </TouchableOpacity>
      ))}

      <PremiumLockedModal
        visible={premiumModalVisible}
        title={premiumModalTitle}
        message={premiumModalMessage}
        onClose={() => setPremiumModalVisible(false)}
      />
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
    marginBottom: 16,
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
    fontWeight: "900",
    color: "#0F172A",
  },

  emptyBox: {
    width: 42,
    height: 42,
  },

  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    marginBottom: 16,
  },

  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  heroTextBox: {
    flex: 1,
  },

  heroTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 6,
  },

  heroText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    fontWeight: "700",
  },

  statusText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "700",
    marginBottom: 10,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
    fontWeight: "700",
  },

  topicCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 14,
  },

  topicTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  topicIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  topicTitleBox: {
    flex: 1,
    paddingRight: 10,
  },

  topicTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },

  topicMeta: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "800",
  },

  premiumBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  premiumText: {
    fontSize: 10,
    color: "#92400E",
    fontWeight: "900",
  },

  topicPrompt: {
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
    fontWeight: "800",
    marginBottom: 12,
  },

  blockLabel: {
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
    marginTop: 8,
    marginBottom: 7,
  },

  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  starterChip: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  starterChipText: {
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  wordChip: {
    backgroundColor: "#F8FAFC",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  wordChipText: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "900",
  },

  cardFooter: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  footerText: {
    fontSize: 13,
    color: ACTION_COLOR,
    fontWeight: "900",
  },
});
