import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline } from "@xenova/transformers";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHUNKS_PATH = path.resolve(__dirname, "./chunkData/chunks.json");

const PINECONE_INDEX = process.env.PINECONE_INDEX;
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || "";

if (!process.env.PINECONE_API_KEY) {
  console.error("Missing PINECONE_API_KEY in environment");
  process.exit(1);
}

async function loadChunks() {
  const raw = fs.readFileSync(CHUNKS_PATH, "utf8");
  return JSON.parse(raw);
}

function batch(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

function toPreview(text) {
  // Keep metadata payload compact
  const trimmed = String(text || "").slice(0, 1200);
  return trimmed;
}

async function main() {
  console.log("Loading chunks...", CHUNKS_PATH);
  const chunks = await loadChunks();
  console.log(`Total chunks: ${chunks.length}`);

  console.log("Init Pinecone and embedder...");
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pinecone.index(PINECONE_INDEX);
  const embedder = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");

  const batches = batch(chunks, 100);
  let upserted = 0;
  for (let b = 0; b < batches.length; b++) {
    const items = batches[b];
    const texts = items.map((c) => c.text || "");
    const embs = [];
    for (const t of texts) {
      const out = await embedder(t, { pooling: "mean", normalize: true });
      embs.push(Array.from(out.data));
    }
    const vectors = items.map((c, i) => ({
      id: `${c.source}:${c.original_index}:${c.chunk_index}`,
      values: embs[i],
      metadata: {
        source: c.source,
        preview: c.text ? JSON.stringify({ content: toPreview(c.text) }) : "",
      },
    }));
    await index.namespace(PINECONE_NAMESPACE).upsert(vectors);
    upserted += items.length;
    console.log(`Upserted ${upserted}/${chunks.length}`);
  }

  console.log("Done upserting to Pinecone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


