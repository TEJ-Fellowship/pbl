// backend/src/ingest_chunks_v2_langchain.js
import fs from "fs/promises";
import path from "path";
import config from "../config/config.js";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";

/**
 * Robust ingest script:
 * - Embeds chunks with LangChain wrapper
 * - Handles "payload too large" by shrinking chunk content and retrying
 * - Uses a flexible Pinecone upsert (tries multiple shapes)
 */

const INPUT_PATH = path.resolve("./src/data/chunks_v2.json");
const BATCH_SIZE = parseInt(config.BATCH_SIZE) || 16; // smaller default
const MAX_EMBED_BYTES = 30000; // safe target (bytes). Gemini complained at ~36000
const MIN_EMBED_CHARS = 200; // give up if shrunk below this

function ensureEnv() {
  if (!config.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY must be set in config/.env");
  }
  if (!config.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY must be set in config/.env");
  }
  if (!config.PINECONE_INDEX_NAME) {
    throw new Error("PINECONE_INDEX_NAME must be set in config/.env");
  }
}

async function initEmbeddings() {
  return new GoogleGenerativeAIEmbeddings({
    apiKey: config.GEMINI_API_KEY,
    modelName: "text-embedding-004",
  });
}

async function initPineconeIndex() {
  const client = new Pinecone({ apiKey: config.PINECONE_API_KEY });
  const index = client.Index(config.PINECONE_INDEX_NAME);
  console.log("✅ Pinecone index initialized:", config.PINECONE_INDEX_NAME);
  return index;
}

// helper: estimate bytes from string (utf-8)
function byteSize(str) {
  return Buffer.byteLength(str, "utf8");
}

// helper: try shrink content progressively (first/last heuristic)
function shrinkContent(content, targetBytes) {
  // If content already small enough, return as-is
  if (byteSize(content) <= targetBytes) return content;

  // Keep head + tail to preserve context
  const keep = Math.floor((targetBytes / 2) * 0.7); // conservative
  const head = content.slice(0, keep);
  const tail = content.slice(-keep);
  const combined = `${head}\n\n...TRUNCATED...\n\n${tail}`;
  if (byteSize(combined) <= targetBytes) return combined;

  // fallback: take first N chars
  let n = Math.floor(targetBytes * 0.8);
  if (n < MIN_EMBED_CHARS) n = MIN_EMBED_CHARS;
  return content.slice(0, n);
}

async function tryUpsert(index, vectors) {
  // Try common Pinecone shapes robustly
  const errors = [];
  try {
    // Pinecone v6 SDK primary shape: index.upsert(vectors)
    await index.upsert(vectors);
    return;
  } catch (e1) {
    errors.push(e1.message || e1.toString());
    try {
      // Some SDK/app examples: index.upsert({ vectors })
      await index.upsert({ vectors });
      return;
    } catch (e2a) {
      errors.push(e2a.message || e2a.toString());
    }
    try {
      // Older shapes: index.upsert({ upsertRequest: { vectors } })
      await index.upsert({ upsertRequest: { vectors } });
      return;
    } catch (e3) {
      errors.push(e3.message || e3.toString());
      // give informative error
      throw new Error(
        "Pinecone upsert failed (tried multiple shapes): " + errors.join(" | ")
      );
    }
  }
}

async function main() {
  try {
    ensureEnv();
    const raw = JSON.parse(await fs.readFile(INPUT_PATH, "utf8"));
    console.log(`📚 Loaded ${raw.length} chunks from ${INPUT_PATH}`);

    const embeddings = await initEmbeddings();
    const index = await initPineconeIndex();

    const batch = [];
    for (let i = 0; i < raw.length; i++) {
      const chunk = raw[i];

      // compute char/byte counts
      const originalLength = chunk.content ? chunk.content.length : 0;
      const originalBytes = byteSize(chunk.content || "");

      // Prepare content for embedding (shrink if necessary)
      let contentToEmbed = chunk.content || "";
      if (originalBytes > MAX_EMBED_BYTES) {
        console.log(
          `⚠️ Chunk ${chunk.id} is large (${originalBytes} bytes) — will attempt to shrink before embedding.`
        );
        contentToEmbed = shrinkContent(contentToEmbed, MAX_EMBED_BYTES);
        const newBytes = byteSize(contentToEmbed);
        console.log(`   → shrunk to ${newBytes} bytes`);
      }

      // Try embedding with progressive shrink on API errors
      let vec = null;
      let attemptContent = contentToEmbed;
      let tried = 0;
      while (!vec) {
        tried++;
        try {
          vec = await embeddings.embedQuery(attemptContent);
          if (!Array.isArray(vec) || vec.length === 0) {
            throw new Error("Empty vector returned");
          }
        } catch (err) {
          const msg = err?.message || String(err);
          // If it's a payload-too-large error, shrink more and retry
          if (
            msg.includes("payload size") ||
            msg.includes("Request payload size") ||
            msg.includes("payload")
          ) {
            // shrink more aggressively
            console.warn(
              `   embedding size error on chunk ${chunk.id}: ${msg}. Shrinking and retrying...`
            );
            if (attemptContent.length <= MIN_EMBED_CHARS) {
              console.warn(
                `   cannot shrink further (below ${MIN_EMBED_CHARS} chars). Skipping chunk ${chunk.id}.`
              );
              break;
            }
            attemptContent = shrinkContent(
              attemptContent,
              Math.floor(MAX_EMBED_BYTES / (1 + tried))
            );
            continue;
          } else {
            // other embedding error — log and break
            console.error(`   embedding failed for chunk ${chunk.id}:`, msg);
            break;
          }
        }
      } // end embedding attempts

      if (!vec || !Array.isArray(vec) || vec.length === 0) {
        console.warn(`⚠️ Skipping chunk ${chunk.id} (no embedding).`);
        continue; // skip this chunk
      }

      // Build vector metadata (sanitize for Pinecone: no nulls, no arrays)
      const metadata = {
        id: chunk.id,
        url: chunk.url || undefined,
        title: chunk.title || undefined,
        api: chunk.api || undefined,
        version: chunk.version || undefined,
        type: chunk.type || undefined,
        language: chunk.language || undefined,
        errorCodes: Array.isArray(chunk.errorCodes)
          ? chunk.errorCodes.join(",")
          : undefined,
        scrapedAt: chunk.scrapedAt || undefined,
        charCount: chunk.content ? chunk.content.length : 0,
        originalLength,
      };
      // Remove undefined entries to keep metadata compact
      Object.keys(metadata).forEach((k) => {
        if (metadata[k] === undefined) delete metadata[k];
      });

      batch.push({
        id: chunk.id,
        values: vec,
        metadata,
      });

      // flush if batch full or last item
      if (batch.length >= BATCH_SIZE || i === raw.length - 1) {
        try {
          console.log(
            `🔁 Upserting batch (size ${batch.length}) — chunks processed: ${
              i + 1
            }/${raw.length}`
          );
          await tryUpsert(index, batch);
          // small backoff
          await new Promise((r) => setTimeout(r, 200));
          batch.length = 0;
        } catch (upErr) {
          console.error("❌ Upsert failed:", upErr.message || upErr);
          // if upsert fails, don't infinite loop — break or continue
          // try to continue processing next chunks
          batch.length = 0;
        }
      }
    } // end for

    console.log("🎉 Ingest complete: all chunks attempted.");
  } catch (err) {
    console.error("❌ Ingest script failed:", err?.message || err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
