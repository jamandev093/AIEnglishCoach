export const analyzeSpeech = (expected: string, spoken: string) => {
  const feedback: any = {
    corrections: [],
    mistakes: [],
    score: 0,
  };

  // Normalize
  const clean = (text: string) =>
    text.toLowerCase().replace(/[.,!?]/g, "").trim();

  const expectedWords = clean(expected).split(" ");
  const spokenWords = clean(spoken).split(" ");

  // 🔹 Missing Words
  expectedWords.forEach((word) => {
    if (!spokenWords.includes(word)) {
      feedback.mistakes.push(`Missing word: "${word}"`);
    }
  });

  // 🔹 Extra Words
  spokenWords.forEach((word) => {
    if (!expectedWords.includes(word)) {
      feedback.mistakes.push(`Unnecessary word: "${word}"`);
    }
  });

  // 🔹 Basic Tense Check
  if (
    expected.includes("went") &&
    spoken.includes("go")
  ) {
    feedback.mistakes.push("Wrong tense: use 'went' instead of 'go'");
  }

  // 🔹 Build Correct Sentence
  feedback.corrections.push(`Correct sentence: "${expected}"`);

  // 🔹 Score
  const correctCount = expectedWords.filter((w) =>
    spokenWords.includes(w)
  ).length;

  feedback.score = Math.round(
    (correctCount / expectedWords.length) * 100
  );

  return feedback;
};

