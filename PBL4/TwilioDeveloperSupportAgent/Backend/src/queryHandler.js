// src/queryHandler.js
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { getEmbedding } = require("./geminiLLM.js");

dotenv.config();

// Cosine similarity function
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

async function searchDocs(query, topK = 3) {
  // Step 1: Load precomputed embeddings
  const embeddingsPath = path.join(__dirname, "data", "embeddings.json");
  const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, "utf-8"));

  // Step 2: Generate embedding for user query
  const queryVector = await getEmbedding(query);
  if (!Array.isArray(queryVector)) {
    throw new Error("Failed to generate embedding for query");
  }

  // Step 3: Compare query vector with all chunk vectors
  const scored = embeddings.map((item) => {
    const score = cosineSimilarity(queryVector, item.vector);
    return { ...item, score };
  });

  // Step 4: Sort by similarity score
  const ranked = scored.sort((a, b) => b.score - a.score).slice(0, topK);

  console.log("🔍 Top results:");
  ranked.forEach((r, i) => {
    console.log(`\n#${i + 1} (${r.score.toFixed(3)})`);
    console.log(`URL: ${r.url}`);
    console.log(`Content: ${r.content.slice(0, 200)}...`);
  });

  return ranked;
}

// Run standalone for testing
if (process.argv[2]) {
  const query = process.argv.slice(2).join(" ");
  searchDocs(query);
}

module.exports = { searchDocs };