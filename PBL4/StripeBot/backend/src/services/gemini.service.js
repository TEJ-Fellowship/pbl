const { GoogleGenerativeAI } = require("@google/generative-ai");
const { AppError } = require("../utils/AppError");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment");
}

/*
- Authenticate to google with valid gemini key, checks if key is valid, billing limits,
- Creates a client instance(genAI) that holds your credentials and is ready to talk to the API.*/
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: GEMINI_MODEL,
  systemInstruction:
    "You are StripeBot, a backend assistant. Be accurate, concise, and practical. If information is missing, ask one clear follow-up question. Do not invent facts. Keep answers under 120 words unless asked for detail.",
}); //specifies exactly which "version" of the AI to use.

async function generateAIResponse(userPrompt) {
  if (!userPrompt || typeof userPrompt !== "string" || !userPrompt.trim()) {
    throw new AppError(
      400,
      "INVALID_PROMPT",
      "Prompt is required and must be a non-empty string",
    );
  }

  try {
    const result = await model.generateContent(userPrompt.trim());
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

    console.error("Gemini API Error:", error);

    throw new AppError(
      500,
      "AI_GENERATION_FAILED",
      "Failed to generate AI response",
    );
  }
}

module.exports = { generateAIResponse };
