import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getPineconeIndex } from "../config/pinecone.js";

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
  // Check for Pinecone configuration
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY is required in environment variables");
  }

  // Get Pinecone index
  const index = await getPineconeIndex();

  async function query({ query, k = 4 }) {
    // naive: embed query via OpenAI each time to compare
    // For simplicity, do it in chat.js before calling query to pass embedding; here use text query only
    throw new Error(
      "createRetriever requires queryEmbedding; call queryEmbeddingAware({ queryEmbedding, k }) instead."
    );
  }

  async function queryEmbeddingAware({ queryEmbedding, k = 4 }) {
    try {
      // Query Pinecone with the embedding
      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK: k,
        includeMetadata: true,
        includeValues: false, // We don't need the vector values back
      });

      // Transform Pinecone results to match the expected format
      const results = queryResponse.matches.map((match) => ({
        doc: match.metadata.text,
        metadata: {
          section: match.metadata.section,
          merchant_level: match.metadata.merchant_level,
          title: match.metadata.title,
          source_url: match.metadata.source_url,
          chunk_index: match.metadata.chunk_index,
          tokens: match.metadata.tokens,
          scraped_at: match.metadata.scraped_at,
        },
        score: match.score,
      }));

      return results;
    } catch (error) {
      console.error("Error querying Pinecone:", error);
      throw new Error(`Failed to query Pinecone: ${error.message}`);
    }
  }

  return { queryEmbeddingAware };
}
