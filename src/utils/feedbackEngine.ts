import { Feedback } from "../types/Feedback";

export const generateFeedback = (text: string): Feedback => {
  let score = 100;

  const mistakes: string[] = [];
  const corrections: string[] = [];
  const explanations: string[] = [];

  if (!text || text.trim() === "") {
    return {
      score: 0,
      mistakes: ["No speech detected"],
      corrections: ["Try speaking clearly"],
      explanations: ["You didn’t say anything."],
      improved: "",
    };
  }

  let improved = text;
  const words = text.toLowerCase().split(" ");

  // ✅ Rule 1: Capital letter
  if (text[0] === text[0].toLowerCase()) {
    mistakes.push("Sentence should start with a capital letter");
    explanations.push("English sentences start with a capital letter.");
    improved = improved.charAt(0).toUpperCase() + improved.slice(1);
    score -= 10;
  }

  // ✅ Rule 2: Full stop
  if (!text.endsWith(".")) {
    mistakes.push("Missing full stop");
    explanations.push("Sentence should end with a period.");
    improved = improved + ".";
    score -= 10;
  }

  // ✅ Rule 3: go market
  if (words.includes("go") && words.includes("market")) {
    if (!words.includes("to")) {
      mistakes.push('Missing "to"');
      explanations.push('Use "to" when going somewhere.');
      improved = improved.replace("go market", "go to the market");
      score -= 15;
    }

    if (!words.includes("the")) {
      mistakes.push('Missing "the"');
      explanations.push('Use "the" for specific places.');
      improved = improved.replace("market", "the market");
      score -= 10;
    }
  }

  // ✅ Rule 4: I is
  if (text.toLowerCase().includes("i is")) {
    mistakes.push('"I is" is incorrect');
    explanations.push('"I" uses "am".');
    improved = improved.replace(/i is/gi, "I am");
    score -= 20;
  }

  // ✅ Rule 5: he go
  if (
    (words.includes("he") || words.includes("she")) &&
    words.includes("go")
  ) {
    mistakes.push('"He/She go" is incorrect');
    explanations.push('Use "goes" with he/she.');
    improved = improved.replace(/\b(he|she) go\b/gi, "$1 goes");
    score -= 15;
  }

  // ✅ Rule 6: did not went
  if (text.toLowerCase().includes("did not went")) {
    mistakes.push('"did not went" is incorrect');
    explanations.push('After "did", use base verb.');
    improved = improved.replace(/did not went/gi, "did not go");
    score -= 20;
  }

  // ✅ Rule 7: she don't
  if (text.toLowerCase().includes("she don't")) {
    mistakes.push('"she don’t" is incorrect');
    explanations.push('"She" uses "does not".');
    improved = improved.replace(/she don't/gi, "she doesn't");
    score -= 15;
  }

  // ✅ Rule 8: i have pen
  if (text.toLowerCase().includes("i have pen")) {
    mistakes.push('Missing "a"');
    explanations.push('Use "a" before singular nouns.');
    improved = improved.replace(/i have pen/gi, "I have a pen");
    score -= 10;
  }

  // 🔥 V3 RULES (CORRECT POSITION)

  // Rule 9: past tense (go → went)
  if (
    (words.includes("yesterday") || words.includes("last")) &&
    words.includes("go")
  ) {
    mistakes.push("Wrong verb tense");
    explanations.push("Use past tense for past time.");
    improved = improved.replace(/\bgo\b/gi, "went");
    score -= 15;
  }

  // Rule 10: buy → bought
  if (
    (words.includes("yesterday") || words.includes("last")) &&
    words.includes("buy")
  ) {
    mistakes.push("Wrong verb tense");
    explanations.push("Past of 'buy' is 'bought'.");
    improved = improved.replace(/\bbuy\b/gi, "bought");
    score -= 15;
  }

  // Rule 11: went market → went to the market
  if (
    words.includes("went") &&
    words.includes("market") &&
    !words.includes("to")
  ) {
    mistakes.push('Missing "to the"');
    explanations.push('Say "went to the market".');
    improved = improved.replace("went market", "went to the market");
    score -= 10;
  }

  // Rule 12: comma after yesterday
  if (text.toLowerCase().startsWith("yesterday")) {
    improved = improved.replace(/yesterday/i, "Yesterday,");
  }

  // ✅ FINAL RETURN (INSIDE FUNCTION)
  return {
    score,
    mistakes,
    corrections,
    explanations,
    improved,
  };
};