import { AppSettings } from "./settingsStore";
import { ProfileData } from "./profileStore";

export type DisplayLanguage = "English" | "Hindi" | "Bengali";

export const getDisplayLanguage = (
  profile: ProfileData,
  settings: AppSettings
): DisplayLanguage => {
  if (settings.englishOnlyMode) {
    return "English";
  }

  if (profile.nativeLanguage === "Hindi") {
    return "Hindi";
  }

  if (profile.nativeLanguage === "Bengali") {
    return "Bengali";
  }

  return "English";
};

export const getLanguageModeLabel = (
  profile: ProfileData,
  settings: AppSettings
) => {
  if (settings.englishOnlyMode) {
    return "English Only";
  }

  return profile.nativeLanguage || "English";
};

export const isEnglishOnlyMode = (settings: AppSettings) => {
  return settings.englishOnlyMode === true;
};