from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .ai_service import generate_ai_report
from .database import Base, SessionLocal, engine
from .quiz_data import QUIZ_QUESTIONS

load_dotenv()
Base.metadata.create_all(bind=engine)


def ensure_users_phone_column():
    with engine.connect() as conn:
        columns = conn.execute(text("PRAGMA table_info(users)")).fetchall()
        column_names = {row[1] for row in columns}
        if "phone" not in column_names:
            conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(50)"))
            conn.commit()


def seed_quiz_questions():
    db = SessionLocal()
    try:
        for item in QUIZ_QUESTIONS:
            question = db.query(models.QuizQuestion).filter(models.QuizQuestion.id == item["id"]).first()
            section_label = ""
            if item["question"].startswith("[") and "]" in item["question"]:
                section_label = item["question"][1 : item["question"].index("]")]
            question_text = item["question"]
            if question:
                question.question_text = question_text
                question.section = section_label
                db.query(models.QuizOption).filter(models.QuizOption.question_id == question.id).delete()
            else:
                question = models.QuizQuestion(
                    id=item["id"],
                    question_text=question_text,
                    section=section_label,
                )
                db.add(question)
                db.flush()

            for index, option in enumerate(item["options"]):
                db.add(
                    models.QuizOption(
                        question_id=question.id,
                        option_letter=option[:1],
                        option_text=option,
                        position=index,
                    )
                )

        db.commit()
    finally:
        db.close()


ensure_users_phone_column()
seed_quiz_questions()

app = FastAPI(title="Quiz Funnel API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/api/quiz-questions", response_model=list[schemas.QuizQuestion])
def fetch_quiz_questions(db: Session = Depends(get_db)):
    question_rows = db.query(models.QuizQuestion).order_by(models.QuizQuestion.id.asc()).all()
    if not question_rows:
        return QUIZ_QUESTIONS

    return [
        {
            "id": row.id,
            "question": row.question_text,
            "options": [opt.option_text for opt in row.options],
        }
        for row in question_rows
    ]


@app.post("/api/submit-answers", response_model=schemas.SubmitAnswersResponse)
def submit_answers(payload: schemas.SubmitAnswersRequest, db: Session = Depends(get_db)):
    answers_dict = [item.model_dump() for item in payload.answers]
    score = crud.compute_score(answers_dict)
    designation = crud.get_category(score)
    archetype = crud.detect_archetype(answers_dict)
    fatal_flaw = crud.detect_fatal_flaw(answers_dict)
    weapon_course = crud.ARCHETYPE_COURSE_MAP.get(archetype, "AI Agents and automated software bots.")
    shield_course = crud.get_recommended_shield(fatal_flaw)
    protocol_course = crud.get_recommended_protocol(designation)
    user_id = (payload.user.email.split("@")[0] if payload.user.email else payload.user.name).upper().replace(" ", "_")
    ai_report = generate_ai_report(
        score=score,
        designation=designation,
        archetype=archetype,
        fatal_flaw=fatal_flaw,
        weapon_course=weapon_course,
        shield_course=shield_course,
        protocol_course=protocol_course,
        user_id=user_id,
        answers=answers_dict,
    )
    recommended_track = weapon_course

    crud.save_quiz_submission(
        db=db,
        name=payload.user.name,
        email=payload.user.email,
        phone=payload.user.phone,
        answers=answers_dict,
        score=score,
        category=designation,
        ai_report=ai_report,
    )

    return schemas.SubmitAnswersResponse(
        score=score,
        category=designation,
        designation=designation,
        archetype=archetype,
        recommended_track=recommended_track,
        fatal_flaw=fatal_flaw,
        ai_report=ai_report,
    )


@app.get("/health")
def health():
    return {"status": "ok"}
