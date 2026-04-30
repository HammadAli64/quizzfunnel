from typing import List

from pydantic import BaseModel, Field


class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[str]


class UserMeta(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    phone: str = Field(pattern=r"^[0-9+\-\s()]{7,20}$")


class AnswerItem(BaseModel):
    question_id: int
    selected_option: str = Field(pattern="^[ABCD]$")


class SubmitAnswersRequest(BaseModel):
    user: UserMeta
    answers: List[AnswerItem]


class SubmitAnswersResponse(BaseModel):
    score: int
    category: str
    designation: str
    archetype: str
    recommended_track: str
    fatal_flaw: str
    ai_report: str
