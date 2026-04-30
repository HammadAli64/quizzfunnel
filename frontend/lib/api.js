const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const REQUEST_TIMEOUT_MS = 10000;
const SUBMIT_TIMEOUT_MS = 90000;

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please check backend connection.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchQuestions() {
  const response = await fetchWithTimeout(`${API_URL}/api/quiz-questions`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch quiz questions");
  }
  return response.json();
}

export async function submitAnswers(payload) {
  const response = await fetchWithTimeout(`${API_URL}/api/submit-answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, SUBMIT_TIMEOUT_MS);

  if (!response.ok) {
    throw new Error("Failed to submit quiz answers");
  }
  return response.json();
}
