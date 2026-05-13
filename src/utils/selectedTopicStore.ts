import AsyncStorage from "@react-native-async-storage/async-storage";

const SELECTED_TOPIC_STORAGE_KEY = "ai_english_coach_selected_topic";

export type SelectedTopicData = {
  id: string;
  title: string;
  type: "topic";
  level: "beginner" | "intermediate" | "advanced";
  category: string;
  languageSupport: "englishOnly" | "nativeSupport" | "both";
  prompt: string;
  expectedResponse?: string | null;
  sentenceStarters: string[];
  keyWords: string[];
  isPremium: boolean;
  savedAt: string;
};

export async function saveSelectedTopic(
  topic: Omit<SelectedTopicData, "savedAt">,
): Promise<void> {
  const topicToSave: SelectedTopicData = {
    ...topic,
    savedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(
    SELECTED_TOPIC_STORAGE_KEY,
    JSON.stringify(topicToSave),
  );
}

export async function getSelectedTopic(): Promise<SelectedTopicData | null> {
  const storedValue = await AsyncStorage.getItem(SELECTED_TOPIC_STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    const parsedTopic = JSON.parse(storedValue) as SelectedTopicData;

    if (!parsedTopic.id || !parsedTopic.title || !parsedTopic.prompt) {
      return null;
    }

    return {
      id: parsedTopic.id,
      title: parsedTopic.title,
      type: "topic",
      level: parsedTopic.level || "beginner",
      category: parsedTopic.category || "general",
      languageSupport: parsedTopic.languageSupport || "both",
      prompt: parsedTopic.prompt,
      expectedResponse: parsedTopic.expectedResponse ?? null,
      sentenceStarters: Array.isArray(parsedTopic.sentenceStarters)
        ? parsedTopic.sentenceStarters
        : [],
      keyWords: Array.isArray(parsedTopic.keyWords)
        ? parsedTopic.keyWords
        : [],
      isPremium:
        typeof parsedTopic.isPremium === "boolean"
          ? parsedTopic.isPremium
          : false,
      savedAt: parsedTopic.savedAt || "",
    };
  } catch (error) {
    console.log("Failed to parse selected topic:", error);
    return null;
  }
}

export async function clearSelectedTopic(): Promise<void> {
  await AsyncStorage.removeItem(SELECTED_TOPIC_STORAGE_KEY);
}
