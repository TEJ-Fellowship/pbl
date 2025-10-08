// backend/src/retrieverQA/foodmanduQA.js
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Setup Pinecone
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

async function retrieveTopSections(query, topK = 3) {
  // Embed the query
  const queryEmbedding = await getGeminiEmbedding(query);

  // Query Pinecone
  const result = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  return (result.matches || [])
    .map((m) => (m.metadata && (m.metadata.text || m.metadata.url)) || "")
    .filter(Boolean);
}

// Gemini API call
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
  throw new Error("Invalid embedding response format");
}

// Gemini QA call
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

  // Gemini generateContent response parsing
  const firstCandidate = data?.candidates?.[0];
  const firstPartText = firstCandidate?.content?.parts?.[0]?.text;
  if (firstPartText) return firstPartText;
  return "Sorry, I could not generate an answer.";
}

// Setup terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function chat() {
  console.log("🟢 Foodmandu QA Chatbot (type 'exit' to quit)");
  while (true) {
    const question = await new Promise((resolve) => {
      rl.question("🟢 Question> ", resolve);
    });
    if (question.toLowerCase() === "exit") break;

    try {
      const topSections = await retrieveTopSections(question, 3);
      const answer = await askGemini(question, topSections);
      console.log(`💡 Answer: ${answer}\n`);
    } catch (err) {
      console.error("❌ Error:", err.message);
    }
  }
  rl.close();
}

chat();
