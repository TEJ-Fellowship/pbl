import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { splitRespectingCodeBlocks } from "./utils/chunker.js";
import { embedTexts } from "./utils/embeddings.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../data/shopify_docs");

async function readDocs() {
  const dir = DATA_DIR;
  const files = await fs.readdir(dir);
  const docs = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    if (f === "scraped.index.json") continue;
    const raw = await fs.readFile(path.join(dir, f), "utf-8");
    docs.push(JSON.parse(raw));
  }
  return docs;
}

async function embedChunks({ chunks }) {
  return await embedTexts(chunks);
}

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

async function main() {
  const provider = (process.env.EMBEDDINGS_PROVIDER || "local").toLowerCase();
  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is required when EMBEDDINGS_PROVIDER=openai"
    );
  }
  const docs = await readDocs();
  if (docs.length === 0) {
    console.log("No docs found. Run `npm run scrape` first.");
    return;
  }

  const indexPath = path.join(__dirname, "../data/shopify_index.json");
  const allItems = [];

  let idCounter = 0;
  for (const doc of docs) {
    const chunks = splitRespectingCodeBlocks(doc.content, {
      chunkSizeTokens: 800,
      chunkOverlapTokens: 100,
      model: "gpt-4o-mini",
    });
    const vectors = await embedChunks({ chunks });
    const items = chunks.map((c, i) => ({
      id: `doc-${Date.now()}-${idCounter++}`,
      text: c,
      embedding: vectors[i],
      metadata: {
        section: doc.section,
        merchant_level: doc.merchant_level,
        title: doc.title,
        source_url: doc.url,
        chunk_index: i,
      },
    }));
    allItems.push(...items);
    console.log(`Indexed ${items.length} chunks from ${doc.title}`);
  }
  await fs.writeFile(
    indexPath,
    JSON.stringify({ items: allItems }, null, 2),
    "utf-8"
  );
  console.log(
    `✅ Ingestion complete. Saved ${allItems.length} chunks to ${indexPath}`
  );
}

if (import.meta.url === pathToFileURL(__filename).href) {
  console.log("Starting ingestion...");
  main().catch((e) => {
    console.error("Ingestion failed:", e?.message || e);
    process.exit(1);
  });
}
