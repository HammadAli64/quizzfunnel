"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import BrandHeader from "@/components/BrandHeader";
import ProgressBar from "@/components/ProgressBar";
import { fetchQuestions, submitAnswers } from "@/lib/api";

const FALLBACK_FIRST_QUESTION = {
  id: 1,
  question: '[Section 1: The Diagnostic] What is the biggest "chain" holding you back from your first million?',
  options: [
    "A) I'm just trying to survive the month.",
    "B) I've been scammed before and I'm scared to move.",
    "C) I have the hustle, but no map or blueprint.",
    'D) I\'m stuck in a circle of "dead-weight" people with no vision.',
  ],
};

export default function QuizPage() {
  const loadingWords = ["Money", "Power", "Freedom", "Honour"];
  const QUIZ_DURATION_SECONDS = 20 * 60;
  const router = useRouter();
  const [questions, setQuestions] = useState([FALLBACK_FIRST_QUESTION]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingWordIndex, setLoadingWordIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION_SECONDS);
  const [showLeadGate, setShowLeadGate] = useState(false);
  const [leadStep, setLeadStep] = useState(null);
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "" });
  const [leadError, setLeadError] = useState("");
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");

  async function loadQuestions() {
    setError("");
    try {
      const data = await fetchQuestions();
      if (Array.isArray(data) && data.length > 0) {
        setQuestions(data);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (!submitting) return undefined;
    const timer = setInterval(() => {
      setLoadingWordIndex((prev) => (prev + 1) % loadingWords.length);
    }, 700);
    return () => clearInterval(timer);
  }, [submitting, loadingWords.length]);

  useEffect(() => {
    if (loading || submitting) return undefined;
    if (timeLeft <= 0) return undefined;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timerId);
  }, [loading, submitting, timeLeft]);

  const currentQuestion = useMemo(() => questions[currentIndex], [questions, currentIndex]);
  const total = questions.length || 17;
  const selectedOption = currentQuestion ? answers[currentQuestion.id] : null;
  const cleanQuestionText = currentQuestion
    ? currentQuestion.question.replace(/^\[[^\]]+\]\s*/g, "")
    : "";

  function pickOption(optionText) {
    const optionLetter = optionText.charAt(0);
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionLetter }));
  }

  function nextQuestion() {
    if (!selectedOption) return;
    const checkpointStep = getCheckpointStep(currentIndex);
    if (checkpointStep) {
      const validationMessage = validateLeadStep(checkpointStep);
      if (validationMessage) {
        setLeadStep(checkpointStep);
        setShowLeadGate(true);
        setLeadError(validationMessage);
        return;
      }
    }
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  function getCheckpointStep(index) {
    if (index === 3) return "name";
    if (index === 9) return "email";
    if (index === 14) return "phone";
    return null;
  }

  function validateLeadStep(step) {
    const name = leadForm.name.trim();
    const email = leadForm.email.trim();
    const phone = leadForm.phone.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9+\-\s()]{7,20}$/;

    if (step === "name" && name.length < 2) return "Please enter your name to continue.";
    if (step === "email" && !emailRegex.test(email)) return "Please enter a valid email address.";
    if (step === "phone" && !phoneRegex.test(phone)) return "Please enter a valid phone number.";
    return "";
  }

  function validateLeadForm() {
    const nameError = validateLeadStep("name");
    if (nameError) return nameError;
    const emailError = validateLeadStep("email");
    if (emailError) return emailError;
    const phoneError = validateLeadStep("phone");
    if (phoneError) return phoneError;
    return "";
  }

  function continueAfterLead() {
    const validationMessage = validateLeadStep(leadStep);
    if (validationMessage) {
      setLeadError(validationMessage);
      return;
    }
    setLeadError("");
    setShowLeadGate(false);
    setLeadStep(null);
    setCurrentIndex((prev) => Math.min(prev + 1, total - 1));
  }

  async function handleSubmit() {
    const validationMessage = validateLeadForm();
    if (validationMessage) {
      const missingStep = validateLeadStep("name")
        ? "name"
        : validateLeadStep("email")
          ? "email"
          : "phone";
      setLeadStep(missingStep);
      setShowLeadGate(true);
      setLeadError(validationMessage || "Please complete your details to continue.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSubmitError("");
    try {
      const answerList = questions.map((q) => ({
        question_id: q.id,
        selected_option: answers[q.id],
      }));

      const payload = {
        user: {
          name: leadForm.name.trim(),
          email: leadForm.email.trim(),
          phone: leadForm.phone.trim(),
        },
        answers: answerList,
      };

      const result = await submitAnswers(payload);
      localStorage.setItem("quiz_result", JSON.stringify(result));
      router.push("/result");
    } catch (err) {
      setSubmitError(err.message || "Failed to submit quiz answers");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (loading || submitting || timeLeft > 0 || questions.length === 0) return;
    void handleSubmit();
  }, [timeLeft, loading, submitting, questions.length]);

  if (error) {
    return (
      <main className="page-wrap">
        <section className="card card-quiz" style={{ maxWidth: 620, textAlign: "center" }}>
          <h2 className="section-title" style={{ marginBottom: 8 }}>Unable to Load Quiz</h2>
          <p className="section-subtitle" style={{ marginBottom: 14 }}>{error}</p>
          <button className="btn btn-primary" onClick={loadQuestions}>
            Retry
          </button>
        </section>
      </main>
    );
  }

  const isLast = currentIndex === total - 1;
  const canSubmit = Object.keys(answers).length === total;
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <main className="page-wrap">
      <section className="card card-quiz">
        <BrandHeader
          subtitle="MONEY • POWER • FREEDOM • HONOUR"
          subtitleClassName="brand-subtitle-gold"
        />
        <ProgressBar current={currentIndex + 1} total={total} />
        <div className="quiz-timer-badge">
          Time Left: {minutes}:{seconds}
        </div>
        {showLeadGate && (
          <>
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(4,8,18,0.72)",
                backdropFilter: "blur(3px)",
                zIndex: 40,
              }}
            />
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(92vw, 560px)",
                border: "1px solid rgba(190,153,46,0.65)",
                borderRadius: 14,
                padding: 16,
                background: "rgba(10,18,35,0.98)",
                boxShadow: "0 0 30px rgba(77,163,255,0.35), 0 0 56px rgba(190,153,46,0.16)",
                zIndex: 50,
              }}
            >
              <h3 style={{ margin: "0 0 8px", color: "#be992e" }}>Continue Quiz</h3>
              <p style={{ margin: "0 0 8px", color: "#d7e5ff" }}>
                {leadStep === "name" && `Enter your name to continue from Question ${currentIndex + 2}.`}
                {leadStep === "email" && `Enter your email to continue from Question ${currentIndex + 2}.`}
                {leadStep === "phone" && `Enter your phone number to continue from Question ${currentIndex + 2}.`}
              </p>
              <p style={{ margin: "0 0 10px", color: "#be992e", fontWeight: 700 }}>
                This is compulsory for your report.
              </p>
              {leadStep === "name" ? (
                <input
                  placeholder="Name"
                  value={leadForm.name}
                  onChange={(e) => {
                    setLeadForm((prev) => ({ ...prev, name: e.target.value }));
                    setLeadError("");
                  }}
                  className="quiz-input"
                />
              ) : null}
              {leadStep === "email" ? (
                <input
                  placeholder="Email"
                  type="email"
                  value={leadForm.email}
                  onChange={(e) => {
                    setLeadForm((prev) => ({ ...prev, email: e.target.value }));
                    setLeadError("");
                  }}
                  className="quiz-input"
                />
              ) : null}
              {leadStep === "phone" ? (
                <input
                  placeholder="Phone Number"
                  value={leadForm.phone}
                  onChange={(e) => {
                    setLeadForm((prev) => ({ ...prev, phone: e.target.value }));
                    setLeadError("");
                  }}
                  className="quiz-input"
                />
              ) : null}
              {leadError ? (
                <p style={{ margin: "0 0 10px", color: "#ff7f9b", fontWeight: 700 }}>{leadError}</p>
              ) : null}
              <button className="btn btn-primary" onClick={continueAfterLead}>
                Continue Quiz
              </button>
            </div>
          </>
        )}
        <h2 className="question-title" style={{ marginBottom: 16 }}>
          {cleanQuestionText}
        </h2>

        {currentQuestion.options.map((option) => (
          <button
            key={option}
            className={`btn option-btn ${selectedOption === option.charAt(0) ? "active" : ""}`}
            onClick={() => pickOption(option)}
          >
            {option}
          </button>
        ))}

        {!isLast && (
          <button className="btn btn-primary" onClick={nextQuestion} disabled={!selectedOption}>
            Next Question
          </button>
        )}

        {isLast && !submitting && (
          <>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={!canSubmit} style={{ marginTop: 8 }}>
              Submit Answers
            </button>
            {submitError ? (
              <p style={{ marginTop: 10, color: "#ff7f9b", fontWeight: 700 }}>
                {submitError}
              </p>
            ) : null}
          </>
        )}
        {isLast && submitting && (
          <div className="submit-loading-wrap">
            <button className="btn btn-primary" disabled>
              Generating Report...
            </button>
            <p className="loading-chant">{loadingWords[loadingWordIndex]}...</p>
            <span className="loading-spinner" aria-hidden="true" />
          </div>
        )}
      </section>
    </main>
  );
}
