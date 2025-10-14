// backend/src/routes/foodmanduRoute.js
import express from "express";
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";

dotenv.config();

const router = express.Router();

// --- Initialize Pinecone ---
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

// --- Helper: Gemini Embedding ---
async function getGeminiEmbedding(text) {
  const MAX_CHARS = 8000;
  const input = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=" +
    process.env.GOOGLE_GEMINI_API_KEY;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/text-embedding-004",
      content: { parts: [{ text: input }] },
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));
  if (data?.embedding?.values) return data.embedding.values;
  if (data?.data?.[0]?.embedding) return data.data[0].embedding;
  throw new Error("Invalid embedding format");
}

// --- Helper: Retrieve Similar Context ---
async function retrieveTopSections(query, topK = 3) {
  const queryEmbedding = await getGeminiEmbedding(query);

  const result = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  return (result.matches || [])
    .map((m) => (m.metadata && (m.metadata.text || m.metadata.url)) || "")
    .filter(Boolean);
}

// --- Helper: Ask Gemini ---
async function askGemini(question, contextSections) {
  const context = contextSections.join("\n\n");
  const prompt = `You are a Foodmandu support assistant. Answer the question based on the context below:\n\nContext:\n${context}\n\nQuestion: ${question}`;

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    process.env.GOOGLE_GEMINI_API_KEY;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || "Sorry, I could not generate an answer.";
}

// --- API Route ---
router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question)
      return res.status(400).json({ error: "Question field is required." });

    const contextSections = await retrieveTopSections(question, 3);
    const answer = await askGemini(question, contextSections);
    res.json({ answer });
  } catch (err) {
    console.error("❌ QA API Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
