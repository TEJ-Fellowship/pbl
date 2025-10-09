// backend/src/embeddings/foodmanduEmbeddings.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";
// Resolve path relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env (stable relative path)
dotenv.config({ path: path.join(__dirname, "../../.env") });

if (!process.env.PINECONE_API_KEY) {
  throw new Error("Missing PINECONE_API_KEY in environment (.env)");
}
if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error("Missing PINECONE_INDEX_NAME in environment (.env)");
}
const docsPath = path.join(__dirname, "../scraper/foodmanduDocs.json");
const rawDocs = JSON.parse(fs.readFileSync(docsPath, "utf-8"));

// Initialize Pinecone (v6 client)
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

// Google Gemini embedding function
async function getGeminiEmbedding(text) {
  // Truncate very long inputs to reduce API errors
  const MAX_CHARS = 8000;
  const input = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=" +
    process.env.GOOGLE_GEMINI_API_KEY;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // The API accepts either short name or fully-qualified name; use fully-qualified
      model: "models/text-embedding-004",
      content: { parts: [{ text: input }] },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const errMsg = data?.error?.message || JSON.stringify(data);
    throw new Error(`Gemini API ${response.status}: ${errMsg}`);
  }

  if (data?.embedding?.values) return data.embedding.values;
  if (data?.data?.[0]?.embedding) return data.data[0].embedding;
  throw new Error("Invalid embedding response format");
}

function adjustEmbeddingLength(values, targetDim) {
  if (!Array.isArray(values))
    throw new Error("Embedding values must be an array");
  if (values.length === targetDim) return values;
  if (values.length > targetDim) return values.slice(0, targetDim);
  const padded = new Array(targetDim);
  for (let i = 0; i < targetDim; i++)
    padded[i] = i < values.length ? values[i] : 0;
  return padded;
}

// Ingest data into Pinecone
async function ingestDocs() {
  const targetDim = Number(process.env.PINECONE_DIMENSION || 768);
  for (const doc of rawDocs) {
    const vectors = [];
    for (const [i, section] of doc.content.entries()) {
      try {
        const embedding = await getGeminiEmbedding(section);
        const values = adjustEmbeddingLength(embedding, targetDim);
        vectors.push({
          id: `${doc.url}-${i}`,
          metadata: { url: doc.url },
          values,
        });
      } catch (err) {
        console.error("Embedding error:", err.message);
      }
    }

    if (vectors.length > 0) {
      await index.upsert(vectors);
      console.log(`✅ Uploaded ${vectors.length} vectors from ${doc.url}`);
    }
  }
}

ingestDocs()
  .then(() => console.log("🎉 All docs ingested!"))
  .catch((err) => console.error("❌ Ingestion failed:", err));
