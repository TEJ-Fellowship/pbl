// //  backend/src/geminiLLM.js
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-preview-05-20",
});

// Use a separate embedding model for embeddings
const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

async function getEmbedding(text) {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}

module.exports = { model, getEmbedding };
