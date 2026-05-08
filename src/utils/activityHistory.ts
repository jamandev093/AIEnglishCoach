import stories from "@/app/stories";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const activityTypes = [
  "speaking",
  "grammar",
  "vocabulary",
  "pronunciation",
  "readingListening",
  "sentenceBuilding",
  "confidence",
  "stories",
] as const;
export type ActivityRecord = {
  id: string;
  type: typeof activityTypes[number];
  title: string;
  detail: string;
  score?: number;
  confidence?: number;
  fluency?: number;
  mistake?: string;
  correctedSentence?: string;
  createdAt: string;
};

export type ActivityAnalytics = {
  totalActivities: number;
  speakingAttempts: number;
  grammarCorrections: number;
  pronunciationPractices: number;
  confidenceMissions: number;
  averageScore: number;
  confidenceAverage: number;
  fluencyAverage: number;
  mostRecentActivity?: ActivityRecord;
};

const ACTIVITY_HISTORY_KEY = "AI_ENGLISH_COACH_ACTIVITY_HISTORY";

const createId = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getActivityHistory = async (): Promise<ActivityRecord[]> => {
  try {
    const savedHistory = await AsyncStorage.getItem(ACTIVITY_HISTORY_KEY);

    if (!savedHistory) {
      return [];
    }

    const parsedHistory = JSON.parse(savedHistory);

    if (!Array.isArray(parsedHistory)) {
      return [];
    }

    return parsedHistory;
  } catch (error) {
    console.log("GET ACTIVITY HISTORY ERROR:", error);
    return [];
  }
};

export const saveActivityHistory = async (history: ActivityRecord[]) => {
  try {
    await AsyncStorage.setItem(ACTIVITY_HISTORY_KEY, JSON.stringify(history));
    return true;
  } catch (error) {
    console.log("SAVE ACTIVITY HISTORY ERROR:", error);
    return false;
  }
};

export const addActivity = async (
  activity: Omit<ActivityRecord, "id" | "createdAt">
) => {
  try {
    const oldHistory = await getActivityHistory();

    const newActivity: ActivityRecord = {
      id: createId(),
      createdAt: new Date().toISOString(),
      ...activity,
    };

    const updatedHistory = [newActivity, ...oldHistory].slice(0, 300);

    await saveActivityHistory(updatedHistory);

    return newActivity;
  } catch (error) {
    console.log("ADD ACTIVITY ERROR:", error);
    return null;
  }
};

export const clearActivityHistory = async () => {
  try {
    await AsyncStorage.removeItem(ACTIVITY_HISTORY_KEY);
    return true;
  } catch (error) {
    console.log("CLEAR ACTIVITY HISTORY ERROR:", error);
    return false;
  }
};

export const getActivityAnalytics = async (): Promise<ActivityAnalytics> => {
  const history = await getActivityHistory();

  const scores = history
    .map((item) => item.score)
    .filter((score): score is number => typeof score === "number");

  const confidenceScores = history
    .map((item) => item.confidence)
    .filter((score): score is number => typeof score === "number");

  const fluencyScores = history
    .map((item) => item.fluency)
    .filter((score): score is number => typeof score === "number");

  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
      : 0;

  const confidenceAverage =
    confidenceScores.length > 0
      ? Math.round(
          confidenceScores.reduce((total, score) => total + score, 0) /
            confidenceScores.length
        )
      : 0;

  const fluencyAverage =
    fluencyScores.length > 0
      ? Math.round(
          fluencyScores.reduce((total, score) => total + score, 0) /
            fluencyScores.length
        )
      : 0;

  return {
    totalActivities: history.length,
    speakingAttempts: history.filter((item) => item.type === "speaking").length,
    grammarCorrections: history.filter((item) => item.type === "grammar").length,
    pronunciationPractices: history.filter(
      (item) => item.type === "pronunciation"
    ).length,
    confidenceMissions: history.filter((item) => item.type === "confidence")
      .length,
    averageScore,
    confidenceAverage,
    fluencyAverage,
    mostRecentActivity: history[0],
  };
};

export const seedDemoActivityHistory = async () => {
  const existingHistory = await getActivityHistory();

  if (existingHistory.length > 0) {
    return existingHistory;
  }

  const demoHistory: ActivityRecord[] = [
    {
      id: createId(),
      type: "pronunciation",
      title: "Pronunciation practice",
      detail: "Repeated: I went to the market.",
      score: 72,
      confidence: 62,
      fluency: 64,
      createdAt: new Date().toISOString(),
    },
    {
      id: createId(),
      type: "grammar",
      title: "Grammar correction",
      detail: "Fixed: I go market → I went to the market.",
      score: 70,
      mistake: "Past tense + missing to",
      correctedSentence: "I went to the market.",
      createdAt: new Date().toISOString(),
    },
    {
      id: createId(),
      type: "confidence",
      title: "Confidence mission",
      detail: "Practiced: Could you repeat that slowly, please?",
      score: 68,
      confidence: 66,
      fluency: 61,
      createdAt: new Date().toISOString(),
    },
  ];

  await saveActivityHistory(demoHistory);

  return demoHistory;
};