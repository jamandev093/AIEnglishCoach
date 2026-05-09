export const API_BASE_URL = "https://aienglishcoach-backend.onrender.com";

export type AnalyzeApiResponse = {
  success: boolean;
  originalText: string;
  correctedText: string;
  improved?: string;
  score: number;
  mistakes: string[];
  simpleExplanation: string;
  teacherExplanation: string;
  smartSuggestion: string;
  repeatSentence: string;
  confidenceScore?: number;
  fluencyScore?: number;
  pronunciationScore?: number;
  coachReply?: string;
};

export async function analyzeSentenceWithBackend(
  text: string
): Promise<AnalyzeApiResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error("Backend analyze request failed");
  }

  return response.json();
}