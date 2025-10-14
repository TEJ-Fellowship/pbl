const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Check if text contains profanity
function containsProfanity(text) {
  if (!text) return false;
  const blacklist = [
    "dumb",
    "stupid",
    "idiot",
    "shut up",
    "suck",
    "wtf",
    "hell",
    "crap",
    "damn",
  ];
  const lower = String(text).toLowerCase();
  return blacklist.some((w) => {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (w.includes(" ")) {
      // For multi-word phrases, simple substring check is sufficient
      return lower.includes(w);
    }
    const re = new RegExp(`\\b${escaped}\\b`, "i");
    return re.test(lower);
  });
}

// Detect sentiment using Gemini AI
async function detectSentiment(text, genAI) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = [
      "Classify the user's tone strictly as one of: frustrated, concerned, neutral.",
      "Rules:",
      "- If there is profanity, insults, or harsh words (e.g., 'dumb', 'stupid', 'idiot'), classify as frustrated.",
      "- If the user expresses worry/uncertainty without rudeness, classify as concerned.",
      "- Otherwise, neutral.",
      "Return ONLY strict JSON with keys sentiment and confidence (high/medium/low).",
      "Example: {\"sentiment\":\"frustrated\",\"confidence\":\"high\"}",
      `Text: ${text}`
    ].join("\n");
    const result = await model.generateContent(prompt);
    const resp = await result.response;
    const raw = resp.text().trim();
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.sentiment === "string") {
      return parsed;
    }
  } catch (_) {
    // fallthrough to default
  }
  if (containsProfanity(text)) {
    return { sentiment: "frustrated", confidence: "high" };
  }
  return { sentiment: "neutral", confidence: "low" };
}

module.exports = {
  containsProfanity,
  detectSentiment
};
