const { containsProfanity } = require("./textUtils");

/**
 * Detect sentiment of user query using AI
 */
async function detectSentiment(text, genAI) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = [
      "Classify the user's tone as one of: frustrated, concerned, neutral.",
      "Rules:",
      "- If there is profanity, insults, or harsh words (e.g., 'dumb', 'stupid', 'idiot'), classify as frustrated.",
      "- If the user expresses worry, uncertainty, panic, or uses emotional language (e.g., 'forgot', 'lost', 'help', 'urgent', '😭', '!!!'), classify as concerned.",
      "- If the user is asking a simple question without emotion, classify as neutral.",
      "Return ONLY strict JSON with keys sentiment and confidence (high/medium/low).",
      'Example: {"sentiment":"concerned","confidence":"high"}',
      `Text: ${text}`,
    ].join("\n");
    const result = await model.generateContent(prompt);
    const resp = await result.response;
    const raw = resp.text().trim();

    // Handle markdown-wrapped JSON response
    let jsonText = raw;
    if (raw.includes("```json")) {
      jsonText = raw.split("```json")[1].split("```")[0].trim();
    } else if (raw.includes("```")) {
      jsonText = raw.split("```")[1].split("```")[0].trim();
    }

    const parsed = JSON.parse(jsonText);
    if (parsed && typeof parsed.sentiment === "string") {
      return parsed;
    }
  } catch (error) {
    console.error("❌ Sentiment detection failed:", error.message);
    console.log("📝 Raw response:", error);
  }
  if (containsProfanity(text)) {
    return { sentiment: "frustrated", confidence: "high" };
  }
  return { sentiment: "neutral", confidence: "low" };
}

module.exports = { detectSentiment };
