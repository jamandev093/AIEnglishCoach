import AsyncStorage from '@react-native-async-storage/async-storage';

export type ScoreEntry = {
  score: number;
  date: string;
};

const SCORE_KEY = 'score_history';

export const saveScore = async (score: number) => {
  try {
    const existing = await getScores();
    const newEntry: ScoreEntry = {
      score,
      date: new Date().toISOString(),
    };

    const updated = [...existing, newEntry];

    await AsyncStorage.setItem(SCORE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.log('Error saving score:', error);
  }
};

export const getScores = async (): Promise<ScoreEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(SCORE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.log('Error getting scores:', error);
    return [];
  }
};

export const clearScores = async () => {
  try {
    await AsyncStorage.removeItem(SCORE_KEY);
  } catch (error) {
    console.log('Error clearing scores:', error);
  }
};