import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cosineSimilarity(a, b) {
  let dot = 0.0;
  let na = 0.0;
  let nb = 0.0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function createRetriever() {
  const indexPath = path.join(__dirname, "../data/shopify_index.json");
  const raw = await fs.readFile(indexPath, "utf-8");
  const { items } = JSON.parse(raw);

  async function query({ query, k = 4 }) {
    // naive: embed query via OpenAI each time to compare
    // For simplicity, do it in chat.js before calling query to pass embedding; here use text query only
    throw new Error(
      "createRetriever requires queryEmbedding; call queryEmbeddingAware({ queryEmbedding, k }) instead."
    );
  }

  async function queryEmbeddingAware({ queryEmbedding, k = 4 }) {
    const scored = items.map((it) => ({
      it,
      score: cosineSimilarity(queryEmbedding, it.embedding),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored
      .slice(0, k)
      .map(({ it, score }) => ({ doc: it.text, metadata: it.metadata, score }));
  }

  return { queryEmbeddingAware };
}
