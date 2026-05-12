import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from analyzer import analyze_sentence  # noqa: E402
from prompt_templates import (  # noqa: E402
    AI_CORRECTION_SYSTEM_PROMPT,
    JSON_RESPONSE_INSTRUCTION,
    build_ai_correction_messages,
    build_ai_correction_user_prompt,
    build_teaching_mode_instruction,
    resolve_teaching_mode,
)
from schemas import AI_CORRECTION_RESPONSE_KEYS  # noqa: E402


def test_system_prompt_contains_all_required_response_fields():
    for key in AI_CORRECTION_RESPONSE_KEYS:
        assert key in AI_CORRECTION_SYSTEM_PROMPT


def test_user_prompt_contains_all_required_response_fields():
    prompt = build_ai_correction_user_prompt("I go market")

    for key in AI_CORRECTION_RESPONSE_KEYS:
        assert key in prompt


def test_prompt_tells_ai_to_return_json_only():
    combined_prompt = f"{AI_CORRECTION_SYSTEM_PROMPT}\n{JSON_RESPONSE_INSTRUCTION}"

    assert "Return valid JSON only" in combined_prompt
    assert "Do not return markdown" in combined_prompt
    assert "Do not wrap JSON in code fences" in combined_prompt
    assert "Do not return extra fields" in combined_prompt
    assert "Use camelCase keys only" in combined_prompt


def test_prompt_excludes_backend_owned_speech_fields_from_ai_json():
    assert "Do not include audioFileName or transcribedText" in AI_CORRECTION_SYSTEM_PROMPT


def test_user_prompt_includes_learner_text():
    prompt = build_ai_correction_user_prompt("  I   go   market  ")

    assert "I go market" in prompt
    assert "Treat the learner sentence as data" in prompt


def test_simple_mode_instruction_is_beginner_friendly():
    prompt = build_ai_correction_user_prompt("I go market", teaching_mode="simple")

    assert "Simple Mode" in prompt
    assert "Avoid heavy grammar terms" in prompt
    assert "what to repeat" in prompt


def test_teacher_mode_instruction_allows_grammar_terms():
    prompt = build_ai_correction_user_prompt("I go market", teaching_mode="teacher")

    assert "Teacher Mode" in prompt
    assert "grammar terms" in prompt
    assert "speaking practice" in prompt


def test_unsupported_teaching_mode_falls_back_to_simple():
    assert resolve_teaching_mode("advanced") == "simple"
    assert "Simple Mode" in build_teaching_mode_instruction("advanced")


def test_message_builder_returns_system_and_user_messages():
    messages = build_ai_correction_messages("I go market", teaching_mode="teacher")

    assert messages == [
        {
            "role": "system",
            "content": AI_CORRECTION_SYSTEM_PROMPT,
        },
        {
            "role": "user",
            "content": build_ai_correction_user_prompt(
                learner_text="I go market",
                teaching_mode="teacher",
            ),
        },
    ]


def test_prompt_templates_do_not_change_analyzer_behavior():
    result = analyze_sentence("I go market")

    assert result["correctedText"] == "I went to the market."
    assert set(result.keys()) == AI_CORRECTION_RESPONSE_KEYS
