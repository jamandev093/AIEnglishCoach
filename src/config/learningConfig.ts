export type LearningMode = {
  useNativeHelp: boolean;
  difficulty: "easy" | "medium" | "hard";
  explanationLanguage: "native" | "english";
};

export const getLearningMode = (
  level: string,
  isAdvanced: boolean
): LearningMode => {
  if (isAdvanced) {
    return {
      useNativeHelp: false,
      difficulty: "hard",
      explanationLanguage: "english",
    };
  }

  switch (level) {
    case "Beginner":
      return {
        useNativeHelp: true,
        difficulty: "easy",
        explanationLanguage: "native",
      };

    case "Intermediate":
      return {
        useNativeHelp: true,
        difficulty: "medium",
        explanationLanguage: "english",
      };

    case "Pro":
      return {
        useNativeHelp: false,
        difficulty: "hard",
        explanationLanguage: "english",
      };

    default:
      return {
        useNativeHelp: true,
        difficulty: "easy",
        explanationLanguage: "native",
      };
  }
};