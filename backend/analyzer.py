from typing import Dict, List


def _clean_text(text: str) -> str:
    return " ".join(text.strip().split())


def _make_score(value: int) -> int:
    return max(0, min(value, 100))


def _base_response(
    original_text: str,
    corrected_text: str,
    mistakes: List[str],
    simple_explanation: str,
    teacher_explanation: str,
    score: int,
    smart_suggestion: str,
) -> Dict:
    safe_score = _make_score(score)

    return {
        "success": True,
        "originalText": original_text,
        "correctedText": corrected_text,
        "improved": corrected_text,
        "score": safe_score,
        "mistakes": mistakes,
        "simpleExplanation": simple_explanation,
        "teacherExplanation": teacher_explanation,
        "smartSuggestion": smart_suggestion,
        "repeatSentence": corrected_text,
        "confidenceScore": _make_score(safe_score - 2),
        "fluencyScore": _make_score(safe_score - 4),
        "pronunciationScore": _make_score(safe_score),
        "coachReply": f"Good try. Repeat this slowly: {corrected_text}",
    }


def analyze_sentence(text: str) -> Dict:
    user_text = _clean_text(text)

    if not user_text:
        return {
            "success": False,
            "originalText": "",
            "correctedText": "",
            "improved": "",
            "score": 0,
            "mistakes": ["Empty input"],
            "simpleExplanation": "Please speak or type one sentence first.",
            "teacherExplanation": "The backend did not receive any sentence to analyze.",
            "smartSuggestion": "Try saying: I went to the market.",
            "repeatSentence": "",
            "confidenceScore": 0,
            "fluencyScore": 0,
            "pronunciationScore": 0,
            "coachReply": "Please try again with one clear sentence.",
        }

    lower = user_text.lower().strip(" .?!")

    if lower == "i go market":
        return _base_response(
            original_text=user_text,
            corrected_text="I went to the market.",
            mistakes=["Wrong tense", "Missing “to”", "Missing “the”"],
            simple_explanation="You are talking about a past action. Say “went”. Also say “go to a place”.",
            teacher_explanation="Use past tense because the action already happened. “Go” becomes “went”. Use “to” before a place and “the” before a specific market.",
            score=62,
            smart_suggestion="Yesterday, I went to the market to buy vegetables.",
        )

    if lower == "i go school every day":
        return _base_response(
            original_text=user_text,
            corrected_text="I go to school every day.",
            mistakes=["Missing “to”"],
            simple_explanation="When you go to a place, use “to”. Say “go to school”.",
            teacher_explanation="The verb “go” is usually followed by “to” before a place. The correct pattern is: subject + go/goes + to + place.",
            score=74,
            smart_suggestion="I go to school every day by bus.",
        )

    if lower == "she go school":
        return _base_response(
            original_text=user_text,
            corrected_text="She goes to school.",
            mistakes=["Wrong verb form", "Missing “to”"],
            simple_explanation="With “she”, say “goes”. Also say “goes to school”.",
            teacher_explanation="In simple present tense, he/she/it takes an -s or -es verb form. So “go” becomes “goes”.",
            score=68,
            smart_suggestion="She goes to school every morning.",
        )

    if lower == "i am agree":
        return _base_response(
            original_text=user_text,
            corrected_text="I agree.",
            mistakes=["Unnecessary “am”"],
            simple_explanation="Do not use “am” with “agree”. Say “I agree”.",
            teacher_explanation="“Agree” is a main verb, not an adjective. So it does not need “am”.",
            score=72,
            smart_suggestion="I agree with your idea.",
        )

    if lower == "i want buy vegetable":
        return _base_response(
            original_text=user_text,
            corrected_text="I want to buy some vegetables.",
            mistakes=["Missing “to”", "Singular/plural issue"],
            simple_explanation="After “want”, use “to”. Say “want to buy”. Use “vegetables” for more than one.",
            teacher_explanation="The correct pattern is: want + to + verb. So we say “I want to buy”.",
            score=66,
            smart_suggestion="I want to buy some fresh vegetables from the market.",
        )

    if lower == "i learning english":
        return _base_response(
            original_text=user_text,
            corrected_text="I am learning English.",
            mistakes=["Missing “am”"],
            simple_explanation="For an action happening now, say “I am learning”.",
            teacher_explanation="Use present continuous tense for an action happening now: subject + am/is/are + verb-ing.",
            score=70,
            smart_suggestion="I am learning English to speak with confidence.",
        )

    if lower == "can you repeat slow":
        return _base_response(
            original_text=user_text,
            corrected_text="Could you repeat that slowly?",
            mistakes=["Less natural phrase", "Adverb form"],
            simple_explanation="Say “slowly” instead of “slow”. “Could you” is more polite.",
            teacher_explanation="Use the adverb “slowly” to describe how someone repeats. “Could you” is a polite request form.",
            score=76,
            smart_suggestion="Could you repeat that slowly, please?",
        )

    if lower == "he wake up then he brush teeth then he go school":
        return _base_response(
            original_text=user_text,
            corrected_text="He wakes up, brushes his teeth, and goes to school.",
            mistakes=["Verb form", "Missing connector words"],
            simple_explanation="With “he”, use wakes, brushes, and goes.",
            teacher_explanation="In simple present tense, he/she/it usually takes -s or -es on the verb.",
            score=69,
            smart_suggestion="First, he wakes up. Then he brushes his teeth. After that, he goes to school.",
        )

    if lower == "she go market she buy vegetable she come home":
        return _base_response(
            original_text=user_text,
            corrected_text="She goes to the market, buys vegetables, and comes home.",
            mistakes=["Verb form", "Missing “to”", "Plural noun"],
            simple_explanation="With “she”, use goes, buys, and comes. Say “goes to the market”.",
            teacher_explanation="For he/she/it in simple present tense, add -s or -es to the verb. Also use “to” before a place.",
            score=68,
            smart_suggestion="First, she goes to the market. Then she buys vegetables. Finally, she comes home.",
        )

    if lower == "teacher asking why i absent yesterday":
        return _base_response(
            original_text=user_text,
            corrected_text="The teacher is asking why I was absent yesterday.",
            mistakes=["Missing “the”", "Missing “is”", "Missing “was”"],
            simple_explanation="Use “is asking” for now. Use “was absent” for yesterday.",
            teacher_explanation="For an action happening now, use “is asking”. For yesterday, use past form “was absent”.",
            score=65,
            smart_suggestion="The teacher is asking why I was absent yesterday.",
        )

    return _base_response(
        original_text=user_text,
        corrected_text=user_text[0].upper() + user_text[1:] if user_text else user_text,
        mistakes=[],
        simple_explanation="Your sentence is understandable. Later, AI will give deeper grammar and fluency feedback.",
        teacher_explanation="This is the MVP rule-based engine. In the next phase, this endpoint will connect to a real AI correction engine.",
        score=78,
        smart_suggestion="Try speaking the same sentence more clearly and naturally.",
    )
