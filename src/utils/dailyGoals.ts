import AsyncStorage from "@react-native-async-storage/async-storage";

export const updateGoal = async (type: string) => {
  const today = new Date().toDateString();

  const savedDate = await AsyncStorage.getItem("goalDate");

  let goals = {
    learn: false,
    practice: false,
    speak: false,
    understand: false,
  };

  if (savedDate === today) {
    const savedGoals = await AsyncStorage.getItem("goals");
    if (savedGoals) goals = JSON.parse(savedGoals);
  }

  // 🔥 Map screens → goal categories
  if (type === "vocabulary" || type === "wordsMeaning") {
    goals.learn = true;
  }

  if (type === "practice" || type === "grammar" || type === "sentenceBuilding") {
    goals.practice = true;
  }

  if (type === "speaking" || type === "pronunciation") {
    goals.speak = true;
  }

  if (type === "readingListening") {
    goals.understand = true;
  }

  await AsyncStorage.setItem("goals", JSON.stringify(goals));
  await AsyncStorage.setItem("goalDate", today);
};

export const getGoals = async () => {
  const savedGoals = await AsyncStorage.getItem("goals");

  return savedGoals
    ? JSON.parse(savedGoals)
    : {
        learn: false,
        practice: false,
        speak: false,
        understand: false,
      };
};