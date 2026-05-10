export const API_BASE_URL = "https://aienglishcoach-backend.onrender.com";

export type AnalyzeApiResponse = {
  success: boolean;
  originalText: string;
  correctedText: string;
  improved: string;
  score: number;
  mistakes: string[];
  simpleExplanation: string;
  teacherExplanation: string;
  smartSuggestion: string;
  repeatSentence: string;
  confidenceScore: number;
  fluencyScore: number;
  pronunciationScore: number;
  coachReply: string;
};

type RawAnalyzeApiResponse = Partial<AnalyzeApiResponse>;

function normalizeAnalyzeResponse(
  data: RawAnalyzeApiResponse,
  fallbackText: string
): AnalyzeApiResponse {
  const correctedText =
    data.correctedText ||
    data.improved ||
    data.repeatSentence ||
    fallbackText;

  const score =
    typeof data.score === "number" && !Number.isNaN(data.score)
      ? data.score
      : 70;

  return {
    success: data.success ?? true,
    originalText: data.originalText || fallbackText,
    correctedText,
    improved: data.improved || correctedText,
    score,
    mistakes:
      Array.isArray(data.mistakes) && data.mistakes.length > 0
        ? data.mistakes
        : ["No major mistake found"],
    simpleExplanation:
      data.simpleExplanation ||
      "Your sentence was checked and improved for clearer speaking.",
    teacherExplanation:
      data.teacherExplanation ||
      data.simpleExplanation ||
      "The sentence was improved for better grammar, structure, and natural speaking.",
    smartSuggestion:
      data.smartSuggestion ||
      data.coachReply ||
      `Try saying: ${correctedText}`,
    repeatSentence: data.repeatSentence || correctedText,
    confidenceScore:
      typeof data.confidenceScore === "number"
        ? data.confidenceScore
        : Math.min(score + 2, 100),
    fluencyScore:
      typeof data.fluencyScore === "number"
        ? data.fluencyScore
        : Math.max(score - 4, 0),
    pronunciationScore:
      typeof data.pronunciationScore === "number"
        ? data.pronunciationScore
        : score,
    coachReply:
      data.coachReply ||
      data.smartSuggestion ||
      `Good try. Repeat this slowly: ${correctedText}`,
  };
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: "GET",
    });

    return response.ok;
  } catch (error) {
    console.log("Backend health check failed:", error);
    return false;
  }
}

export async function analyzeSentenceWithBackend(
  text: string
): Promise<AnalyzeApiResponse> {
  const cleanText = text.trim();

  if (!cleanText) {
    throw new Error("Text is required for backend analysis");
  }

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: cleanText }),
  });

  if (!response.ok) {
    throw new Error(`Backend analyze request failed: ${response.status}`);
  }

  const data = (await response.json()) as RawAnalyzeApiResponse;

  return normalizeAnalyzeResponse(data, cleanText);
}


export async function analyzeSpeechWithBackend(
  audioUri: string
): Promise<AnalyzeApiResponse> {
  if (!audioUri.trim()) {
    throw new Error("Audio URI is required for speech analysis");
  }

  const fileName = audioUri.split("/").pop() || "speech.m4a";

  const formData = new FormData();

  formData.append("file", {
    uri: audioUri,
    name: fileName,
    type: "audio/m4a",
  } as any);

  const response = await fetch(`${API_BASE_URL}/speech/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Backend speech analyze request failed: ${response.status}`);
  }

  const data = (await response.json()) as RawAnalyzeApiResponse;

  return normalizeAnalyzeResponse(data, "I go market");
}