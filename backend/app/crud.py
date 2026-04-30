from sqlalchemy.orm import Session

from . import models
from .quiz_data import QUIZ_QUESTIONS

SCORE_MAP = {"A": 1, "B": 3, "C": 5, "D": 10}
OPTION_INDEX_MAP = {"A": 0, "B": 1, "C": 2, "D": 3}
ARCHETYPE_COURSE_MAP = {
    "Ghost Architect": "AI Agents and automated software bots.",
    "Attention Broker": "Faceless content and digital influence.",
    "System Architect": "Global logistics and automated publishing.",
    "Profit Raider": "Crypto markets and Blockchain loops.",
}
SHIELD_BY_VIRUS = {
    "Analysis Paralysis": "Mastering Consistency",
    "Lack of Consistency": "Mastering Consistency",
    "Fear of Persuasion": "The 9 to 5 Exit Strategy",
    "Technical Illiteracy": "Zero to One Million",
    "The Amateur": "Zero to One Million",
    "The Financial Leak": "The Compound Effect",
    "The Spender": "The Compound Effect",
    "The Loner": "The Art of Mastering Human Behavior",
    "The Order Taker": "The Art of Business Persuasion",
    "Identity Crisis": "The Secret To Transformation",
    "The Slow Burner": "Hustle Hard",
    "The Visionary": "The Business of Empire Building",
    "The Magic Pill": "Syndicate Money Philosophy",
    "Crabs in a Bucket": "Syndicate 13 Business Rules",
}
PROTOCOL_BY_DESIGNATION = {
    "THE STREET SOLDIER": "The 9 to 5 Exit Strategy",
    "THE ROGUE OPERATOR": "Syndicate 13 Business Rules",
    "THE SYNDICATE SPECIALIST": "Zero to One Million",
    "THE PROSPECT (EMPIRE TIER)": "The Business of Empire Building",
}


def compute_score(answers: list[dict]) -> int:
    return sum(SCORE_MAP[item["selected_option"]] for item in answers)


def get_category(score: int) -> str:
    if 17 <= score <= 50:
        return "THE STREET SOLDIER"
    if 51 <= score <= 100:
        return "THE ROGUE OPERATOR"
    if 101 <= score <= 140:
        return "THE SYNDICATE SPECIALIST"
    return "THE PROSPECT (EMPIRE TIER)"


def _extract_tag(option_text: str) -> str:
    if "(" in option_text and ")" in option_text:
        return option_text.split("(")[-1].replace(")", "").strip()
    return "Unknown"


def build_answer_lookup() -> dict[int, dict[str, str]]:
    lookup: dict[int, dict[str, str]] = {}
    for question in QUIZ_QUESTIONS:
        mapping: dict[str, str] = {}
        for letter, index in OPTION_INDEX_MAP.items():
            mapping[letter] = question["options"][index]
        lookup[question["id"]] = mapping
    return lookup


def detect_archetype(answers: list[dict]) -> str:
    answer_lookup = build_answer_lookup()
    archetype_counts = {
        "Ghost Architect": 0,
        "Attention Broker": 0,
        "System Architect": 0,
        "Profit Raider": 0,
    }
    q7_archetype_map = {
        "A": "Profit Raider",
        "B": "Ghost Architect",
        "C": "Attention Broker",
        "D": "System Architect",
    }
    for item in answers:
        question_id = item["question_id"]
        letter = item["selected_option"]
        if question_id == 5:
            option_text = answer_lookup[question_id][letter]
            tag = _extract_tag(option_text)
            if tag in archetype_counts:
                archetype_counts[tag] += 1
        elif question_id == 7:
            mapped = q7_archetype_map.get(letter)
            if mapped:
                archetype_counts[mapped] += 1

    # Tie-breaker is deterministic order matching PDF mapping list.
    for archetype in ["Ghost Architect", "Attention Broker", "System Architect", "Profit Raider"]:
        if archetype_counts[archetype] == max(archetype_counts.values()):
            return archetype
    return "System Architect"


def detect_fatal_flaw(answers: list[dict]) -> str:
    answer_lookup = build_answer_lookup()
    diagnostic_question_ids = {8, 9, 10, 16}

    top_flaw = "Analysis Paralysis"
    top_score = -1
    for item in answers:
        if item["question_id"] not in diagnostic_question_ids:
            continue
        letter = item["selected_option"]
        points = SCORE_MAP[letter]
        option_text = answer_lookup[item["question_id"]][letter]
        tag = _extract_tag(option_text)
        if points > top_score:
            top_score = points
            top_flaw = tag
    return top_flaw


def get_recommended_shield(fatal_flaw: str) -> str:
    return SHIELD_BY_VIRUS.get(fatal_flaw, "Syndicate 13 Business Rules")


def get_recommended_protocol(designation: str) -> str:
    return PROTOCOL_BY_DESIGNATION.get(designation, "Syndicate 13 Business Rules")


def build_archetype_mapping_block(archetype: str) -> str:
    lines = [
        "The Archetype (Skill Course Mapping)",
        "Determined by the majority of answers in Q2 and Q6.",
        f"Selected Archetype: {archetype}",
        f"Recommended Track: {ARCHETYPE_COURSE_MAP.get(archetype, 'System Architect')}",
    ]
    return "\n".join(lines)


def save_quiz_submission(
    db: Session,
    name: str | None,
    email: str | None,
    phone: str | None,
    answers: list[dict],
    score: int,
    category: str,
    ai_report: str,
) -> models.Result:
    user = models.User(name=name, email=email, phone=phone)
    db.add(user)
    db.flush()

    for item in answers:
        response = models.Response(
            user_id=user.id,
            question_id=item["question_id"],
            selected_option=item["selected_option"],
        )
        db.add(response)

    result = models.Result(
        user_id=user.id,
        score=score,
        category=category,
        ai_report=ai_report,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result
