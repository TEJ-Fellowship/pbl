const { GoogleGenerativeAI } = require("@google/generative-ai");
const { AppError } = require("../utils/AppError");
const { REWRITE_SYSTEM_PROMPT } = require("../constants/aiPrompts");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 15000);

// Wraps an asynchronous operation with a timeout, so it either returns the result quickly or throws a clear error if it takes too long
function withTimeout(promise, ms) {
  let timer;
  // Promise.race runs multiple promises and returns the result of the one that settles first (resolves or rejects)
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new AppError(504, "AI_TIMEOUT", "AI provider timed out"));
      }, ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment");
}

/*
- Authenticate to google with valid gemini key, checks if key is valid, billing limits,
- Creates a client instance(genAI) that holds your credentials and is ready to talk to the API.*/
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const rewriteModel = genAI.getGenerativeModel({
  model: GEMINI_MODEL,
  systemInstruction: REWRITE_SYSTEM_PROMPT,
});

async function generateAIResponse(userPrompt) {
  if (!userPrompt || typeof userPrompt !== "string" || !userPrompt.trim()) {
    throw new AppError(
      400,
      "INVALID_PROMPT",
      "Prompt is required and must be a non-empty string",
    );
  }

  try {
    const result = await withTimeout(
      model.generateContent(userPrompt.trim()),
      GEMINI_TIMEOUT_MS,
    );
    const response = result.response.text();

    if (!response) {
      throw new AppError(
        502,
        "EMPTY_AI_RESPONSE",
        "AI returned an empty response",
      );
    }

    return response;
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error("Gemini API Error", {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      status: error?.status,
    });

    throw new AppError(
      500,
      "AI_GENERATION_FAILED",
      "Failed to generate AI response",
    );
  }
}

module.exports = { generateAIResponse };
