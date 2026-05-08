import AsyncStorage from "@react-native-async-storage/async-storage";

export type CoachVoice = "Female" | "Male" | "Default";

export type AppSettings = {
  notificationsEnabled: boolean;
  dailyReminderEnabled: boolean;
  coachVoice: CoachVoice;
  darkModeEnabled: boolean;
  micBluetoothEnabled: boolean;

  /**
   * Global product rule:
   * true  = English-to-English learning only. Hide native-language support everywhere.
   * false = Use selected native language for meaning/explanation support.
   */
  englishOnlyMode: boolean;
};

const SETTINGS_STORAGE_KEY = "AI_ENGLISH_COACH_APP_SETTINGS";

export const defaultSettings: AppSettings = {
  notificationsEnabled: true,
  dailyReminderEnabled: false,
  coachVoice: "Default",
  darkModeEnabled: false,
  micBluetoothEnabled: false,
  englishOnlyMode: false,
};

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const savedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!savedSettings) {
      return defaultSettings;
    }

    const parsedSettings = JSON.parse(savedSettings);

    return {
      ...defaultSettings,
      ...parsedSettings,
    };
  } catch (error) {
    console.log("GET SETTINGS ERROR:", error);
    return defaultSettings;
  }
};

export const saveSettings = async (settings: AppSettings) => {
  try {
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.log("SAVE SETTINGS ERROR:", error);
    return false;
  }
};

export const updateSettings = async (updates: Partial<AppSettings>) => {
  try {
    const currentSettings = await getSettings();

    const updatedSettings: AppSettings = {
      ...currentSettings,
      ...updates,
    };

    await saveSettings(updatedSettings);

    return updatedSettings;
  } catch (error) {
    console.log("UPDATE SETTINGS ERROR:", error);
    return defaultSettings;
  }
};

export const resetSettings = async () => {
  try {
    await saveSettings(defaultSettings);
    return defaultSettings;
  } catch (error) {
    console.log("RESET SETTINGS ERROR:", error);
    return defaultSettings;
  }

  
};
