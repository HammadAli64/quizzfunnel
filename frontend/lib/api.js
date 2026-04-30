const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const REQUEST_TIMEOUT_MS = 10000;
const SUBMIT_TIMEOUT_MS = 90000;

function getApiBaseUrl() {
  const normalized = RAW_API_URL.trim().replace(/\/+$/, "");
  if (normalized) {
    // Accept either:
    // - https://backend.example.com
    // - https://backend.example.com/api
    return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
  }
  // Local dev fallback.
  if (typeof window === "undefined") return "http://localhost:8000/api";
  // Browser fallback when env is missing in hosted builds.
  return `${window.location.origin}/api`;
}

function buildApiUrl(path) {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

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
  const response = await fetchWithTimeout(buildApiUrl("/quiz-questions"), { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch quiz questions");
  }
  return response.json();
}

export async function submitAnswers(payload) {
  const response = await fetchWithTimeout(buildApiUrl("/submit-answers"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, SUBMIT_TIMEOUT_MS);

  if (!response.ok) {
    throw new Error("Failed to submit quiz answers");
  }
  return response.json();
}
