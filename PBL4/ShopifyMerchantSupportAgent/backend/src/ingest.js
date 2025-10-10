import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { splitRespectingCodeBlocks, estimateTokens } from "./utils/chunker.js";
import { embedTexts } from "./utils/embeddings.js";
import { createPineconeIndex, getPineconeIndex } from "../config/pinecone.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../data/shopify_docs");
const CHUNKS_DIR = path.join(__dirname, "../data/chunks");

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

  // Check for Pinecone configuration
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY is required in environment variables");
  }

  await fs.mkdir(CHUNKS_DIR, { recursive: true });
  const docs = await readDocs();
  if (docs.length === 0) {
    console.log("No docs found. Run `npm run scrape` first.");
    return;
  }

  // Initialize Pinecone index
  console.log("🔗 Connecting to Pinecone...");
  const index = await createPineconeIndex();
  console.log("✅ Connected to Pinecone successfully");

  const allItems = [];

  let idCounter = 0;
  function determineMerchantLevel({ content, section, docLevel }) {
    const advancedKeywords = [
      "api",
      "graphql",
      "liquid",
      "webhook",
      "metafield",
      "script tag",
      "theme development",
      "javascript",
      "css",
      "html",
      "custom code",
      "integration",
      "automation",
      "bulk operations",
      "csv import",
      "developer",
      "programming",
      "customize theme",
    ];
    const beginnerKeywords = [
      "getting started",
      "setup",
      "basic",
      "simple",
      "first time",
      "new to",
      "introduction",
      "overview",
      "getting set up",
      "checklist",
      "tutorial",
    ];
    const lower = (content || "").toLowerCase();
    const sec = (section || "").toLowerCase();

    if (
      sec === "getting_started" ||
      sec.includes("getting-started") ||
      sec.includes("getting_started")
    ) {
      return "beginner";
    }

    const advHits = advancedKeywords.reduce(
      (n, k) => n + (lower.includes(k) ? 1 : 0),
      0
    );
    const begHits = beginnerKeywords.reduce(
      (n, k) => n + (lower.includes(k) ? 1 : 0),
      0
    );

    const isOpsSection = sec.includes("products") || sec.includes("orders");

    if (advHits >= 2 || (advHits >= 1 && !begHits)) {
      return "advanced";
    }
    if (begHits >= 1 && advHits === 0) {
      return "beginner";
    }
    if (isOpsSection) {
      return "intermediate";
    }
    return docLevel || "beginner";
  }

  for (const doc of docs) {
    console.log(`📄 Processing document: ${doc.title}`);

    const chunks = splitRespectingCodeBlocks(doc.content, {
      chunkSizeTokens: 800,
      chunkOverlapTokens: 100,
      model: "gpt-4o-mini",
    });

    // Per-chunk token count and merchant level
    const chunkInfos = chunks.map((c, i) => {
      const tokens = estimateTokens(c);
      const merchant_level = determineMerchantLevel({
        content: c,
        section: doc.section,
        docLevel: doc.merchant_level,
      });
      return { text: c, tokens, merchant_level, index: i };
    });

    console.log(`🔢 Generating embeddings for ${chunkInfos.length} chunks...`);
    const vectors = await embedChunks({
      chunks: chunkInfos.map((ci) => ci.text),
    });

    // Prepare vectors for Pinecone
    const vectorsToUpsert = chunkInfos.map((ci, i) => ({
      id: `doc-${Date.now()}-${idCounter++}`,
      values: vectors[i],
      metadata: {
        text: ci.text,
        section: doc.section,
        merchant_level: ci.merchant_level,
        title: doc.title,
        source_url: doc.url,
        chunk_index: ci.index,
        tokens: ci.tokens,
        scraped_at: doc.scrapedAt,
      },
    }));

    // Upsert vectors to Pinecone in batches
    const batchSize = 100;
    for (let i = 0; i < vectorsToUpsert.length; i += batchSize) {
      const batch = vectorsToUpsert.slice(i, i + batchSize);
      console.log(
        `📤 Uploading batch ${Math.floor(i / batchSize) + 1} to Pinecone...`
      );
      await index.upsert(batch);
    }

    allItems.push(...vectorsToUpsert);
    console.log(
      `✅ Indexed ${vectorsToUpsert.length} chunks from ${doc.title}`
    );

    // Also write chunks file for transparency/debugging
    const baseName = (doc.section || doc.title || "doc")
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/-+/g, "-");
    const chunkFilePath = path.join(CHUNKS_DIR, `chunks_${baseName}.json`);
    const chunkFileItems = vectorsToUpsert.map((it) => ({
      id: it.id,
      text: it.metadata.text,
      tokens: it.metadata.tokens,
      metadata: {
        title: it.metadata.title,
        section: it.metadata.section,
        source: it.metadata.source_url,
        category: it.metadata.section,
        merchant_level: it.metadata.merchant_level,
        scraped_at: it.metadata.scraped_at,
        chunk_index: it.metadata.chunk_index,
      },
    }));
    await fs.writeFile(
      chunkFilePath,
      JSON.stringify(chunkFileItems, null, 2),
      "utf-8"
    );
  }
  // Get index stats to confirm upload
  const stats = await index.describeIndexStats();
  console.log(`📊 Pinecone index stats:`, {
    totalVectorCount: stats.totalVectorCount,
    dimension: stats.dimension,
    indexFullness: stats.indexFullness,
  });

  console.log(
    `✅ Ingestion complete. Successfully uploaded ${
      allItems.length
    } chunks to Pinecone index "${
      process.env.PINECONE_INDEX_NAME || "shopify-merchant-support"
    }"`
  );
}

if (import.meta.url === pathToFileURL(__filename).href) {
  console.log("Starting ingestion...");
  main().catch((e) => {
    console.error("Ingestion failed:", e?.message || e);
    process.exit(1);
  });
}
