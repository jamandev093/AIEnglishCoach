import AsyncStorage from "@react-native-async-storage/async-storage";

export type LearningMode = "Easy Mode" | "Teaching Mode";

export type ProfileData = {
  name: string;
  phone: string;
  gmail: string;
  nativeLanguage: string;
  learningMode: LearningMode;
  advancedMode: boolean;
  imageUri: string;
};

export const PROFILE_STORAGE_KEY = "AI_ENGLISH_COACH_PROFILE";

export const defaultProfile: ProfileData = {
  name: "English Learner",
  phone: "",
  gmail: "",
  nativeLanguage: "Hindi",
  learningMode: "Easy Mode",
  advancedMode: false,
  imageUri: "",
};

export const getProfile = async (): Promise<ProfileData> => {
  try {
    const savedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);

    if (!savedProfile) {
      return defaultProfile;
    }

    return {
      ...defaultProfile,
      ...JSON.parse(savedProfile),
    };
  } catch (error) {
    console.log("GET PROFILE ERROR:", error);
    return defaultProfile;
  }
};

export const saveProfile = async (profile: ProfileData) => {
  try {
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch (error) {
    console.log("SAVE PROFILE ERROR:", error);
    return false;
  }
};

export const clearProfile = async () => {
  try {
    await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
    return true;
  } catch (error) {
    console.log("CLEAR PROFILE ERROR:", error);
    return false;
  }
};