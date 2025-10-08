// backend/src/geminiLLM.simple.js
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
dotenv.config();

// Initialize client - pass API key as string directly
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * getEmbedding(text)
 * - returns Array<number> or null on error
 */
async function getEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    console.error("getEmbedding error:", err?.message || err);
    return null;
  }
}

/**
 * generateAnswer(prompt)
 * - returns string answer
 */
async function generateAnswer(prompt, opts = {}) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: opts.maxTokens || 512,
        temperature: opts.temperature || 0.0,
      },
    });

    return result.response.text();
  } catch (err) {
    console.error("generateAnswer error:", err?.message || err);
    throw err;
  }
}

module.exports = { getEmbedding, generateAnswer };
