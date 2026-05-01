import AsyncStorage from "@react-native-async-storage/async-storage";



// 🔥 Update Progress + Streak
export const updateProgress = async () => {
  const today = new Date();

  const lastDateStr = await AsyncStorage.getItem("lastDate");
  const savedProgress = await AsyncStorage.getItem("progress");
  const savedStreak = await AsyncStorage.getItem("streak");

  let progress = savedProgress ? parseInt(savedProgress) : 0;
  let streak = savedStreak ? parseInt(savedStreak) : 1;

  // Increase progress
  progress += 10;
  if (progress > 100) progress = 100;

  if (lastDateStr) {
    const lastDate = new Date(lastDateStr);
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak += 1;
    } else if (diffDays > 1) {
      streak = 1;
    }
  }

  await AsyncStorage.setItem("lastDate", today.toISOString());
  await AsyncStorage.setItem("progress", progress.toString());
  await AsyncStorage.setItem("streak", streak.toString());
};

export const saveLastScreenAuto = async (path: string) => {
  // remove "/" from path
  const screen = path.replace("/", "");
  await AsyncStorage.setItem("lastScreen", screen);
};