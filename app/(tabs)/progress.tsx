import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  ActivityAnalytics,
  ActivityRecord,
  clearActivityHistory,
  getActivityAnalytics,
  getActivityHistory,
} from "../../src/utils/activityHistory";

const ACTION_COLOR = "#8499DC";

type FeatureSummary = {
  title: string;
  type: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  count: number;
  averageScore: number;
};

type MistakeItem = {
  mistake: string;
  count: number;
};

type CoachPlanItem = {
  title: string;
  subtitle: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const defaultAnalytics: ActivityAnalytics = {
  totalActivities: 0,
  speakingAttempts: 0,
  grammarCorrections: 0,
  pronunciationPractices: 0,
  confidenceMissions: 0,
  averageScore: 0,
  confidenceAverage: 0,
  fluencyAverage: 0,
};

const featureBlueprints = [
  {
    title: "Speaking Coach",
    type: "speaking",
    route: "/(tabs)/speaking",
    icon: "mic-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    title: "Pronunciation",
    type: "pronunciation",
    route: "/pronunciations",
    icon: "volume-high-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    title: "Vocabulary",
    type: "vocabulary",
    route: "/vocabulary",
    icon: "book-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    title: "Grammar",
    type: "grammar",
    route: "/grammar",
    icon: "school-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    title: "Reading & Listening",
    type: "readingListening",
    route: "/readingListening",
    icon: "headset-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    title: "Sentence Building",
    type: "sentenceBuilding",
    route: "/sentencesBuilding",
    icon: "create-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    title: "Confidence Building",
    type: "confidence",
    route: "/confidenceBuilding",
    icon: "shield-checkmark-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    title: "Stories",
    type: "stories",
    route: "/stories",
    icon: "images-outline" as keyof typeof Ionicons.glyphMap,
  },
];

export default function ProgressScreen() {
  const [analytics, setAnalytics] =
    useState<ActivityAnalytics>(defaultAnalytics);
  const [history, setHistory] = useState<ActivityRecord[]>([]);

  const loadProgressData = useCallback(async () => {
    try {
      const savedHistory = await getActivityHistory();
      const savedAnalytics = await getActivityAnalytics();

      setHistory(savedHistory);
      setAnalytics(savedAnalytics);
    } catch (error) {
      console.log("Failed to load progress data:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgressData();
    }, [loadProgressData])
  );

  const totalActivities = analytics.totalActivities || history.length;

  const confidenceValue =
    analytics.confidenceAverage > 0 ? analytics.confidenceAverage : 62;

  const fluencyValue =
    analytics.fluencyAverage > 0 ? analytics.fluencyAverage : 64;

  const averageScore =
    analytics.averageScore > 0 ? analytics.averageScore : getAverageScore(history);

  const recentActivities = history.slice(0, 5);

  const mistakeMemory = useMemo(() => {
    return buildMistakeMemory(history);
  }, [history]);

  const latestCorrectedSentences = useMemo(() => {
    return history
      .filter((item) => Boolean(getCorrectedSentence(item)))
      .slice(0, 4);
  }, [history]);

  const repeatHistory = useMemo(() => {
    return history
      .filter((item) => {
        const title = getText(item.title).toLowerCase();
        const detail = getText(item.detail).toLowerCase();
        return title.includes("repeat") || detail.includes("repeated");
      })
      .slice(0, 4);
  }, [history]);

  const featureSummaries = useMemo(() => {
    return featureBlueprints.map((feature) => {
      const featureActivities = history.filter(
        (item) => getActivityType(item) === feature.type
      );

      return {
        ...feature,
        count: featureActivities.length,
        averageScore: getAverageScore(featureActivities),
      };
    });
  }, [history]);

  const weakAreas = useMemo(() => {
    return buildWeakAreas(featureSummaries, mistakeMemory);
  }, [featureSummaries, mistakeMemory]);

  const strongAreas = useMemo(() => {
    return buildStrongAreas(featureSummaries);
  }, [featureSummaries]);

  const coachPlan = useMemo(() => {
    return buildCoachPlan(mistakeMemory, weakAreas, latestCorrectedSentences);
  }, [mistakeMemory, weakAreas, latestCorrectedSentences]);

  const confidenceTrend = useMemo(() => {
    const values = history
      .map((item) => getNumberValue(item, "confidence"))
      .filter((value) => value > 0)
      .slice(0, 7)
      .reverse();

    if (values.length > 0) {
      return values;
    }

    return [42, 48, 52, 56, 58, 62, confidenceValue];
  }, [history, confidenceValue]);

  const resetProgress = () => {
    Alert.alert(
      "Reset progress?",
      "This will clear your local progress, activity history, mistake memory, and saved practice data from this device.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await clearActivityHistory();
            await loadProgressData();
          },
        },
      ]
    );
  };

  const openRoute = (route: string) => {
    router.push(route as any);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Your speaking journey</Text>
          <Text style={styles.title}>Progress</Text>
        </View>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetProgress}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh-outline" size={20} color={ACTION_COLOR} />
        </TouchableOpacity>
      </View>

      {/* Main Growth Card */}
      <View style={styles.growthCard}>
        <View style={styles.growthTopRow}>
          <View style={styles.growthIcon}>
            <Ionicons name="trending-up-outline" size={28} color={ACTION_COLOR} />
          </View>

          <View style={styles.growthTextBox}>
            <Text style={styles.growthLabel}>Real Speaking Growth</Text>
            <Text style={styles.growthTitle}>
              {totalActivities > 0 ? "Progress is building" : "Start your journey"}
            </Text>
          </View>

          <View style={styles.growthScorePill}>
            <Text style={styles.growthScoreText}>{averageScore}%</Text>
          </View>
        </View>

        <Text style={styles.growthText}>
          Progress is calculated from your saved practice actions, corrected
          sentences, confidence attempts, and repeated mistakes.
        </Text>

        <View style={styles.mainStatsGrid}>
          <View style={styles.mainStatBox}>
            <Text style={styles.mainStatValue}>{confidenceValue}%</Text>
            <Text style={styles.mainStatLabel}>Confidence</Text>
          </View>

          <View style={styles.mainStatBox}>
            <Text style={styles.mainStatValue}>{fluencyValue}%</Text>
            <Text style={styles.mainStatLabel}>Fluency</Text>
          </View>

          <View style={styles.mainStatBox}>
            <Text style={styles.mainStatValue}>{averageScore}%</Text>
            <Text style={styles.mainStatLabel}>Avg Score</Text>
          </View>

          <View style={styles.mainStatBox}>
            <Text style={styles.mainStatValue}>{totalActivities}</Text>
            <Text style={styles.mainStatLabel}>Activities</Text>
          </View>
        </View>
      </View>

      {/* Speaking Confidence Trend */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardIcon}>
            <Ionicons name="analytics-outline" size={22} color={ACTION_COLOR} />
          </View>

          <View style={styles.cardTitleBox}>
            <Text style={styles.cardTitle}>Speaking Confidence Trend</Text>
            <Text style={styles.cardSubtitle}>
              Last saved confidence values from your practice history.
            </Text>
          </View>
        </View>

        <View style={styles.trendRow}>
          {confidenceTrend.map((value, index) => (
            <View key={`${value}-${index}`} style={styles.trendItem}>
              <View style={styles.trendBarBox}>
                <View
                  style={[
                    styles.trendBar,
                    {
                      height: `${Math.max(value, 12)}%`,
                    },
                  ]}
                />
              </View>

              <Text style={styles.trendLabel}>{index + 1}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Mistake Memory */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardIcon}>
            <Ionicons name="brain-outline" size={22} color={ACTION_COLOR} />
          </View>

          <View style={styles.cardTitleBox}>
            <Text style={styles.cardTitle}>Mistake Memory</Text>
            <Text style={styles.cardSubtitle}>
              Repeated mistakes your coach should remember.
            </Text>
          </View>
        </View>

        {mistakeMemory.length > 0 ? (
          mistakeMemory.slice(0, 5).map((item, index) => (
            <View key={`${item.mistake}-${index}`} style={styles.memoryRow}>
              <View style={styles.memoryNumber}>
                <Text style={styles.memoryNumberText}>{index + 1}</Text>
              </View>

              <View style={styles.memoryTextBox}>
                <Text style={styles.memoryTitle}>{item.mistake}</Text>
                <Text style={styles.memorySubtitle}>
                  Found {item.count} time{item.count > 1 ? "s" : ""} in your
                  saved practice.
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyBoxCard}>
            <Text style={styles.emptyTitle}>No repeated mistake yet</Text>
            <Text style={styles.emptyText}>
              After you practice speaking, grammar, sentence building, and
              stories, your repeated mistakes will appear here.
            </Text>
          </View>
        )}
      </View>

      {/* Weak and Strong Areas */}
      <View style={styles.twoColumnRow}>
        <View style={styles.halfCard}>
          <View style={styles.smallCardIcon}>
            <Ionicons name="warning-outline" size={21} color={ACTION_COLOR} />
          </View>

          <Text style={styles.halfCardTitle}>Weak Areas</Text>

          {weakAreas.length > 0 ? (
            weakAreas.slice(0, 3).map((item) => (
              <View key={item} style={styles.smallBulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.smallBulletText}>{item}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.halfEmptyText}>
              Practice more to detect weak areas.
            </Text>
          )}
        </View>

        <View style={styles.halfCard}>
          <View style={styles.smallCardIcon}>
            <Ionicons
              name="checkmark-circle-outline"
              size={21}
              color={ACTION_COLOR}
            />
          </View>

          <Text style={styles.halfCardTitle}>Strong Areas</Text>

          {strongAreas.length > 0 ? (
            strongAreas.slice(0, 3).map((item) => (
              <View key={item} style={styles.smallBulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.smallBulletText}>{item}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.halfEmptyText}>
              Strong areas will appear after practice.
            </Text>
          )}
        </View>
      </View>

      {/* Today Coach Plan */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardIcon}>
            <Ionicons name="sparkles-outline" size={22} color={ACTION_COLOR} />
          </View>

          <View style={styles.cardTitleBox}>
            <Text style={styles.cardTitle}>Today’s Coach Plan</Text>
            <Text style={styles.cardSubtitle}>
              What your AI coach should make you practice next.
            </Text>
          </View>
        </View>

        {coachPlan.map((item, index) => (
          <TouchableOpacity
            key={`${item.title}-${index}`}
            style={styles.planRow}
            activeOpacity={0.85}
            onPress={() => openRoute(item.route)}
          >
            <View style={styles.planIcon}>
              <Ionicons name={item.icon} size={20} color={ACTION_COLOR} />
            </View>

            <View style={styles.planTextBox}>
              <Text style={styles.planTitle}>{item.title}</Text>
              <Text style={styles.planSubtitle}>{item.subtitle}</Text>
            </View>

            <Ionicons name="chevron-forward" size={21} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Feature-wise Summary */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardIcon}>
            <Ionicons name="grid-outline" size={22} color={ACTION_COLOR} />
          </View>

          <View style={styles.cardTitleBox}>
            <Text style={styles.cardTitle}>Feature Progress</Text>
            <Text style={styles.cardSubtitle}>
              Practice summary from each learning area.
            </Text>
          </View>
        </View>

        <View style={styles.featureList}>
          {featureSummaries.map((feature) => (
            <TouchableOpacity
              key={feature.title}
              style={styles.featureRow}
              activeOpacity={0.85}
              onPress={() => openRoute(feature.route)}
            >
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={20} color={ACTION_COLOR} />
              </View>

              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSubtitle}>
                  {feature.count} practice{feature.count === 1 ? "" : "s"} saved
                </Text>
              </View>

              <View style={styles.featureScoreBox}>
                <Text style={styles.featureScoreText}>
                  {feature.averageScore > 0 ? `${feature.averageScore}%` : "—"}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Last Corrected Sentences */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardIcon}>
            <Ionicons name="create-outline" size={22} color={ACTION_COLOR} />
          </View>

          <View style={styles.cardTitleBox}>
            <Text style={styles.cardTitle}>Last Corrected Sentences</Text>
            <Text style={styles.cardSubtitle}>
              Sentences your coach improved recently.
            </Text>
          </View>
        </View>

        {latestCorrectedSentences.length > 0 ? (
          latestCorrectedSentences.map((item, index) => (
            <View key={`${getCorrectedSentence(item)}-${index}`} style={styles.sentenceBox}>
              <Text style={styles.sentenceLabel}>
                {getActivityTitle(item) || "Corrected sentence"}
              </Text>
              <Text style={styles.sentenceText}>{getCorrectedSentence(item)}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyBoxCard}>
            <Text style={styles.emptyTitle}>No corrected sentence yet</Text>
            <Text style={styles.emptyText}>
              Corrected sentences from Speaking, Grammar, Sentence Building, and
              Stories will appear here.
            </Text>
          </View>
        )}
      </View>

      {/* Repeat Practice History */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardIcon}>
            <Ionicons name="repeat-outline" size={22} color={ACTION_COLOR} />
          </View>

          <View style={styles.cardTitleBox}>
            <Text style={styles.cardTitle}>Repeat Practice History</Text>
            <Text style={styles.cardSubtitle}>
              Repeated sentences and stories build real fluency.
            </Text>
          </View>
        </View>

        {repeatHistory.length > 0 ? (
          repeatHistory.map((item, index) => (
            <View key={`${getActivityDetail(item)}-${index}`} style={styles.repeatRow}>
              <Ionicons
                name="checkmark-circle-outline"
                size={19}
                color={ACTION_COLOR}
              />

              <View style={styles.repeatTextBox}>
                <Text style={styles.repeatTitle}>
                  {getActivityTitle(item) || "Repeat practice"}
                </Text>
                <Text style={styles.repeatSubtitle}>{getActivityDetail(item)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyBoxCard}>
            <Text style={styles.emptyTitle}>No repeat saved yet</Text>
            <Text style={styles.emptyText}>
              After you tap Repeat It in result popups, your repeat practice will
              appear here.
            </Text>
          </View>
        )}
      </View>

      {/* Recent Activities */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardIcon}>
            <Ionicons name="time-outline" size={22} color={ACTION_COLOR} />
          </View>

          <View style={styles.cardTitleBox}>
            <Text style={styles.cardTitle}>Recent Activities</Text>
            <Text style={styles.cardSubtitle}>
              Last saved learning actions on this device.
            </Text>
          </View>
        </View>

        {recentActivities.length > 0 ? (
          recentActivities.map((item, index) => (
            <View key={`${getActivityTitle(item)}-${index}`} style={styles.activityRow}>
              <View style={styles.activityIcon}>
                <Ionicons
                  name={getActivityIcon(getActivityType(item))}
                  size={20}
                  color={ACTION_COLOR}
                />
              </View>

              <View style={styles.activityTextBox}>
                <Text style={styles.activityTitle}>{getActivityTitle(item)}</Text>
                <Text style={styles.activityDetail}>{getActivityDetail(item)}</Text>
              </View>

              <View style={styles.activityScorePill}>
                <Text style={styles.activityScoreText}>
                  {getNumberValue(item, "score") || "—"}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyBoxCard}>
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyText}>
              Start with Speaking, Sentence Building, Confidence Building, or
              Stories. Your progress will be saved here.
            </Text>
          </View>
        )}
      </View>

      {/* Continue Buttons */}
      <View style={styles.actionCard}>
        <Text style={styles.actionTitle}>Continue Building Progress</Text>
        <Text style={styles.actionText}>
          Practice today so your progress becomes real, personal, and useful.
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.lightButton}
            onPress={() => openRoute("/confidenceBuilding")}
            activeOpacity={0.85}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={ACTION_COLOR}
            />
            <Text style={styles.lightButtonText}>Confidence</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => openRoute("/(tabs)/speaking")}
            activeOpacity={0.85}
          >
            <Ionicons name="mic-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Speak Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function buildMistakeMemory(history: ActivityRecord[]): MistakeItem[] {
  const mistakeCount: Record<string, number> = {};

  history.forEach((item) => {
    const mistake = getText((item as any).mistake);

    if (!mistake.trim()) return;

    const parts = mistake
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    parts.forEach((part) => {
      mistakeCount[part] = (mistakeCount[part] || 0) + 1;
    });
  });

  return Object.entries(mistakeCount)
    .map(([mistake, count]) => ({ mistake, count }))
    .sort((a, b) => b.count - a.count);
}

function buildWeakAreas(
  featureSummaries: FeatureSummary[],
  mistakeMemory: MistakeItem[]
) {
  const weakFeatureAreas = featureSummaries
    .filter((item) => item.count > 0 && item.averageScore > 0 && item.averageScore < 70)
    .map((item) => item.title);

  const mistakeAreas = mistakeMemory.slice(0, 2).map((item) => item.mistake);

  const combined = [...mistakeAreas, ...weakFeatureAreas];

  return Array.from(new Set(combined));
}

function buildStrongAreas(featureSummaries: FeatureSummary[]) {
  return featureSummaries
    .filter((item) => item.count > 0 && item.averageScore >= 70)
    .map((item) => item.title);
}

function buildCoachPlan(
  mistakeMemory: MistakeItem[],
  weakAreas: string[],
  latestCorrectedSentences: ActivityRecord[]
): CoachPlanItem[] {
  const topMistake = mistakeMemory[0]?.mistake || "past tense and sentence order";
  const weakArea = weakAreas[0] || "Speaking confidence";
  const correctedSentence =
    latestCorrectedSentences[0] &&
    getCorrectedSentence(latestCorrectedSentences[0]);

  return [
    {
      title: `Fix: ${topMistake}`,
      subtitle: correctedSentence
        ? `Repeat this: ${correctedSentence}`
        : "Practice one corrected sentence and repeat it aloud.",
      route: "/grammar",
      icon: "school-outline",
    },
    {
      title: `Strengthen: ${weakArea}`,
      subtitle:
        "Do one small focused practice so this weak area becomes easier.",
      route: getRouteForWeakArea(weakArea),
      icon: "trending-up-outline",
    },
    {
      title: "Speak once today",
      subtitle:
        "Open Speaking Coach and say one real-life sentence without fear.",
      route: "/(tabs)/speaking",
      icon: "mic-outline",
    },
  ];
}

function getRouteForWeakArea(area: string) {
  const lower = area.toLowerCase();

  if (lower.includes("sentence")) return "/sentencesBuilding";
  if (lower.includes("confidence")) return "/confidenceBuilding";
  if (lower.includes("pronunciation")) return "/pronunciations";
  if (lower.includes("vocabulary")) return "/vocabulary";
  if (lower.includes("reading")) return "/readingListening";
  if (lower.includes("story")) return "/stories";
  if (lower.includes("grammar")) return "/grammar";

  return "/(tabs)/speaking";
}

function getAverageScore(items: ActivityRecord[]) {
  const scores = items
    .map((item) => getNumberValue(item, "score"))
    .filter((score) => score > 0);

  if (scores.length === 0) return 0;

  const total = scores.reduce((sum, score) => sum + score, 0);

  return Math.round(total / scores.length);
}

function getActivityType(item: ActivityRecord) {
  return getText((item as any).type);
}

function getActivityTitle(item: ActivityRecord) {
  return getText((item as any).title) || "Learning activity";
}

function getActivityDetail(item: ActivityRecord) {
  return getText((item as any).detail) || "Practice saved";
}

function getCorrectedSentence(item: ActivityRecord) {
  return getText((item as any).correctedSentence);
}

function getNumberValue(item: ActivityRecord, key: string) {
  const value = (item as any)[key];

  if (typeof value === "number") return Math.round(value);

  const parsed = Number(value);

  if (Number.isNaN(parsed)) return 0;

  return Math.round(parsed);
}

function getText(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function getActivityIcon(type: string): keyof typeof Ionicons.glyphMap {
  if (type === "speaking") return "mic-outline";
  if (type === "pronunciation") return "volume-high-outline";
  if (type === "vocabulary") return "book-outline";
  if (type === "grammar") return "school-outline";
  if (type === "readingListening") return "headset-outline";
  if (type === "sentenceBuilding") return "create-outline";
  if (type === "confidence") return "shield-checkmark-outline";
  if (type === "stories") return "images-outline";

  return "sparkles-outline";
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 18,
    paddingBottom: 120,
  },

  header: {
    marginTop: 8,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  greeting: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "700",
    marginBottom: 4,
  },

  title: {
    fontSize: 30,
    lineHeight: 36,
    color: "#0F172A",
    fontWeight: "900",
  },

  resetButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  growthCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  growthTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  growthIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  growthTextBox: {
    flex: 1,
  },

  growthLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "900",
    marginBottom: 4,
  },

  growthTitle: {
    fontSize: 20,
    lineHeight: 25,
    color: "#0F172A",
    fontWeight: "900",
  },

  growthScorePill: {
    minWidth: 58,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  growthScoreText: {
    fontSize: 16,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  growthText: {
    fontSize: 13,
    lineHeight: 21,
    color: "#64748B",
    fontWeight: "700",
    marginBottom: 15,
  },

  mainStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  mainStatBox: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },

  mainStatValue: {
    fontSize: 24,
    color: ACTION_COLOR,
    fontWeight: "900",
    marginBottom: 5,
  },

  mainStatLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "900",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  cardTitleBox: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  trendRow: {
    height: 120,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  trendItem: {
    flex: 1,
    alignItems: "center",
  },

  trendBarBox: {
    width: 18,
    height: 78,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    justifyContent: "flex-end",
    overflow: "hidden",
  },

  trendBar: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: ACTION_COLOR,
  },

  trendLabel: {
    marginTop: 7,
    fontSize: 11,
    color: "#64748B",
    fontWeight: "900",
  },

  memoryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 10,
  },

  memoryNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  memoryNumberText: {
    color: ACTION_COLOR,
    fontSize: 13,
    fontWeight: "900",
  },

  memoryTextBox: {
    flex: 1,
  },

  memoryTitle: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 3,
  },

  memorySubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    lineHeight: 17,
  },

  emptyBoxCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyTitle: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 5,
  },

  emptyText: {
    fontSize: 12,
    lineHeight: 19,
    color: "#64748B",
    fontWeight: "600",
  },

  twoColumnRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },

  halfCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  smallCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  halfCardTitle: {
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 10,
  },

  smallBulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 7,
  },

  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ACTION_COLOR,
    marginTop: 6,
    marginRight: 7,
  },

  smallBulletText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#334155",
    fontWeight: "700",
  },

  halfEmptyText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  planRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 10,
  },

  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  planTextBox: {
    flex: 1,
  },

  planTitle: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 4,
  },

  planSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  featureList: {
    gap: 10,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  featureTextBox: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 3,
  },

  featureSubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  featureScoreBox: {
    minWidth: 48,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  featureScoreText: {
    fontSize: 13,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  sentenceBox: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginTop: 10,
  },

  sentenceLabel: {
    fontSize: 12,
    color: "#166534",
    fontWeight: "900",
    marginBottom: 5,
  },

  sentenceText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#166534",
    fontWeight: "900",
  },

  repeatRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 10,
  },

  repeatTextBox: {
    flex: 1,
    marginLeft: 9,
  },

  repeatTitle: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 4,
  },

  repeatSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 10,
  },

  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  activityTextBox: {
    flex: 1,
  },

  activityTitle: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 4,
  },

  activityDetail: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  activityScorePill: {
    minWidth: 42,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },

  activityScoreText: {
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
  },

  actionTitle: {
    fontSize: 18,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 7,
  },

  actionText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    fontWeight: "600",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },

  lightButton: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  lightButtonText: {
    marginLeft: 7,
    fontSize: 14,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  primaryButtonText: {
    marginLeft: 7,
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "900",
  },
});