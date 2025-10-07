// //  backend/src/geminiLLM.js

const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const genAI = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

async function getEmbedding(inputText) {
  const response = await genAI.embeddings.create({
    model: "gemini-text-embedding-3-large", // latest embedding model
    input: inputText,
  });
  return response.data[0].embedding;
}

module.exports = { getEmbedding };
