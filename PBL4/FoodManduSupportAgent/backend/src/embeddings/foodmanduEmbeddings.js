// src/embeddings/foodmanduEmbeddings.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const docsPath = path.join(__dirname, "../scraper/foodmanduDocs.json");
const rawDocs = JSON.parse(fs.readFileSync(docsPath, "utf-8"));

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

// Gemini Embedding function
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

function adjustEmbeddingLength(values, targetDim) {
  if (values.length === targetDim) return values;
  if (values.length > targetDim) return values.slice(0, targetDim);
  return [...values, ...Array(targetDim - values.length).fill(0)];
}

// Chunk text into ~500 token pieces (approx 2000 chars = 500 tokens)
function chunkText(text, maxChars = 2000, overlap = 200) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    let chunk = text.slice(start, end);

    // Try to break at sentence boundary if not at the end
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf(".");
      const lastQuestion = chunk.lastIndexOf("?");
      const lastExclaim = chunk.lastIndexOf("!");
      const lastBreak = Math.max(lastPeriod, lastQuestion, lastExclaim);

      if (lastBreak > maxChars / 2) {
        chunk = chunk.slice(0, lastBreak + 1);
        start += lastBreak + 1;
      } else {
        start = end;
      }
    } else {
      start = end;
    }

    chunk = chunk.trim();
    if (chunk.length > 50) {
      // Skip very short chunks
      chunks.push(chunk);
    }

    // Add overlap for context continuity
    start = Math.max(start - overlap, start);
  }

  return chunks;
}

// Determine topic from URL
function getTopicFromUrl(url) {
  const urlLower = url.toLowerCase();
  if (urlLower.includes("payment")) return "payment";
  if (urlLower.includes("refund")) return "refund";
  if (
    urlLower.includes("coverage") ||
    urlLower.includes("availableareas") ||
    urlLower.includes("delivery")
  )
    return "delivery";
  if (urlLower.includes("restaurant-partner")) return "restaurant";
  if (urlLower.includes("faq") || urlLower.includes("help")) return "support";
  if (urlLower.includes("howtoorder") || urlLower.includes("how-to-order"))
    return "ordering";
  if (urlLower.includes("terms") || urlLower.includes("privacy"))
    return "policy";
  if (urlLower.includes("contact")) return "contact";
  return "general";
}

// Determine user type from URL
function getUserTypeFromUrl(url) {
  const urlLower = url.toLowerCase();
  if (urlLower.includes("restaurant-partner")) return "restaurant";
  return "customer";
}

// Detect language from text (simple heuristic)
function detectLanguage(text) {
  // Check for Devanagari script (Nepali)
  const nepaliChars = text.match(/[\u0900-\u097F]/g);
  if (nepaliChars && nepaliChars.length > 10) return "np";
  return "en";
}

async function ingestDocs() {
  const targetDim = Number(process.env.PINECONE_DIMENSION || 768);
  let totalChunks = 0;

  for (const doc of rawDocs) {
    const vectors = [];
    const topic = getTopicFromUrl(doc.url);
    const userType = getUserTypeFromUrl(doc.url);

    for (const [i, section] of doc.content.entries()) {
      try {
        // Chunk the section into ~500 token pieces
        const chunks = chunkText(section);

        for (const [j, chunk] of chunks.entries()) {
          const embedding = await getGeminiEmbedding(chunk);
          const values = adjustEmbeddingLength(embedding, targetDim);
          const language = detectLanguage(chunk);

          vectors.push({
            id: `${doc.url}-${i}-${j}`,
            metadata: {
              url: doc.url,
              text: chunk,
              topic,
              user_type: userType,
              language,
              section_index: i,
              chunk_index: j,
            },
            values,
          });
          totalChunks++;
        }
      } catch (err) {
        console.error("Embedding error:", err.message);
      }
    }

    if (vectors.length > 0) {
      await index.upsert(vectors);
      console.log(
        `✅ Uploaded ${vectors.length} vectors from ${doc.url} (topic: ${topic}, user_type: ${userType})`
      );
    }
  }

  console.log(`📊 Total chunks processed: ${totalChunks}`);
}

ingestDocs()
  .then(() => console.log("🎉 All docs ingested!"))
  .catch((err) => console.error("❌ Ingestion failed:", err));
