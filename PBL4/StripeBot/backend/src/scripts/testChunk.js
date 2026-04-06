/**
 * Chunking for scraped Stripe docs — replace or extend this file when your colleague
 * lands their chunking logic. Exported API should stay stable for ingest.
 */

/** @typedef {{ id: string, url: string, category: string, title: string, content: string, scrapedAt?: string, metadata?: object }} ScrapedDoc */

const DEFAULT_MAX_CHARS = Number(process.env.CHUNK_MAX_CHARS) || 800;
const DEFAULT_OVERLAP = Number(process.env.CHUNK_OVERLAP) || 100;

/**
 * Split plain text into overlapping windows (character-based; simple & predictable).
 * @param {string} text
 * @param {{ maxChars?: number, overlap?: number }} [options]
 * @returns {string[]}
 */
export function chunkText(text, options = {}) {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;

  const normalized = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return [];

  const chunks = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + maxChars, normalized.length);
    chunks.push(normalized.slice(start, end).trim());
    if (end >= normalized.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks.filter(Boolean);
}

/**
 * @param {ScrapedDoc} doc
 * @param {{ maxChars?: number, overlap?: number }} [options]
 */
export function chunkScrapedDocument(doc, options) {
  const parts = chunkText(doc.content, options);
  return parts.map((content, chunkIndex) => ({
    sourceDocId: doc.id,
    sourceUrl: doc.url,
    category: doc.category,
    title: doc.title,
    chunkIndex,
    content,
    metadata: {
      scrapedAt: doc.scrapedAt,
      ...(doc.metadata && typeof doc.metadata === "object" ? doc.metadata : {}),
    },
  }));
}

/**
 * @param {ScrapedDoc[]} docs
 * @param {{ maxChars?: number, overlap?: number }} [options]
 */
export function chunkScrapedDocuments(docs, options) {
  return docs.flatMap((d) => chunkScrapedDocument(d, options));
}

async function main() {
  const path = await import("path");
  const fs = await import("fs/promises");
  const jsonPath = path.join(process.cwd(), "data", "stripe_docs", "scraped.json");
  try {
    const raw = await fs.readFile(jsonPath, "utf8");
    const docs = JSON.parse(raw);
    const chunks = chunkScrapedDocuments(docs);
    console.log("✅ testChunk: read", docs.length, "scraped doc(s) →", chunks.length, "chunk(s)");
    if (chunks[0]) {
      console.log("— sample chunk[0] length:", chunks[0].content.length, "chars");
    }
  } catch (e) {
    console.error("❌ testChunk:", e.message);
    console.error("   Run from backend root with data/stripe_docs/scraped.json present, or npm run scrape first.");
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith("testChunk.js")) {
  main();
}
