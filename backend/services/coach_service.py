def analyze_sentence(text: str):
    lower = text.lower().strip()

    mistakes = []
    improved = text
    explanation = "Good sentence. Keep practicing."
    coach_reply = "Great job! Keep going."
    score = 9

    # RULE 1: I go market
    if "go market" in lower or "i go market" in lower:
        mistakes = [
            'Missing preposition "to"',
            'Missing article "the"',
            "Wrong tense (go → went)"
        ]

        improved = "I went to the market"

        explanation = (
            "You said 'I go market'. In English we say 'go to' a place. "
            "Because this sentence refers to a past action, we use 'went' "
            "instead of 'go'. Also we usually say 'the market'."
        )

        coach_reply = "Good try. Repeat after me: I went to the market."

        score = 5

    # RULE 2: I go somewhere (tense issue)
    elif "i go " in lower:
        mistakes = ["Wrong tense (go → went)"]

        improved = text.replace("go", "went")

        explanation = (
            "Use past tense 'went' when talking about something that already happened."
        )

        coach_reply = f"Nice attempt. Try saying: {improved}"

        score = 7

    return {
        "score": score,
        "mistakes": mistakes,
        "corrections": [],
        "improved": improved,
        "explanation": explanation,
        "coach_reply": coach_reply,
    }