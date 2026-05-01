import AsyncStorage from "@react-native-async-storage/async-storage";

// 🔥 Save analytics
export const updateAnalytics = async (module: string, score: number) => {
  const saved = await AsyncStorage.getItem("analytics");

  let data: any = saved ? JSON.parse(saved) : {};

  if (!data[module]) {
    data[module] = { total: 0, count: 0 };
  }

  data[module].total += score;
  data[module].count += 1;

  await AsyncStorage.setItem("analytics", JSON.stringify(data));
};

// 🔥 Get analytics
export const getAnalytics = async () => {
  const saved = await AsyncStorage.getItem("analytics");
  return saved ? JSON.parse(saved) : {};
};

// 🔥 Calculate insights
export const calculateInsights = (data: any) => {
  let strengths: string[] = [];
  let weaknesses: string[] = [];
  let improvement: string[] = [];

  Object.keys(data).forEach((key) => {
    const avg = data[key].total / data[key].count;

    if (avg >= 8) strengths.push(key);
    else if (avg >= 5) improvement.push(key);
    else weaknesses.push(key);
  });

  return { strengths, weaknesses, improvement };
};

// 🔥 Suggestions
export const generateSuggestions = (insights: any) => {
  let suggestions: string[] = [];

  insights.weaknesses.forEach((item: string) => {
    suggestions.push(`👉 Focus on ${item} today`);
  });

  insights.improvement.forEach((item: string) => {
    suggestions.push(`👉 Practice more ${item}`);
  });

  insights.strengths.forEach((item: string) => {
    suggestions.push(`✔ ${item} is strong — try advanced`);
  });

  return suggestions;
};

// 🔥 Daily Plan
export const generateDailyPlan = (insights: any) => {
  let plan: string[] = [];

  insights.weaknesses.forEach((item: string) => {
    plan.push(`✔ Practice ${item}`);
  });

  insights.improvement.forEach((item: string) => {
    plan.push(`✔ Improve ${item}`);
  });

  insights.strengths.forEach((item: string) => {
    plan.push(`✔ Advance ${item}`);
  });

  return plan.slice(0, 3);
};
export const getAdaptiveLevel = (insights: any, module: string) => {
  if (insights.weaknesses.includes(module)) {
    return "easy";
  }

  if (insights.improvement.includes(module)) {
    return "medium";
  }

  if (insights.strengths.includes(module)) {
    return "hard";
  }

  return "medium"; // default
};