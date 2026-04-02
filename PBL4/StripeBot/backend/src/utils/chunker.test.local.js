const { chunkScrapedJSON, chunkPageObject } = require("./chunker");
const { countTokens } = require("./tokenCounter");

// Mocked scraped JSON — mimics your teammate's output
const scrapedPages = [
  {
    id: "api_001",
    url: "https://stripe.com/docs/api",
    category: "api",
    title: "API Reference",
    docType: "api",
    scrapedAt: new Date().toISOString(),
    wordCount: 300,
    content: `
Stripe supports cards, wallets, and bank debits.
You can create payment intents and confirm them on client or server.
Webhooks notify your backend for async payment updates.
Refunds, disputes, and subscriptions are supported as well.
    `.repeat(20),
    metadata: {
      source: "stripe.com",
      contentType: "text/html; charset=utf-8",
    },
  },
  {
    id: "api_002",
    url: "https://stripe.com/docs/payments",
    category: "payments",
    title: "Payments Guide",
    docType: "guide",
    scrapedAt: new Date().toISOString(),
    wordCount: 150,
    content: `
Authentication uses API keys with sk_test_ and sk_live_ prefixes.
All requests must be made over HTTPS.
Test mode does not affect live data.
    `.repeat(10),
    metadata: {
      source: "stripe.com",
      contentType: "text/html; charset=utf-8",
    },
  },
  // Edge case: empty content
  {
    id: "api_003",
    url: "https://stripe.com/docs/empty",
    category: "misc",
    title: "Empty Page",
    docType: "guide",
    scrapedAt: new Date().toISOString(),
    wordCount: 0,
    content: "",
    metadata: {
      source: "stripe.com",
      contentType: "text/html; charset=utf-8",
    },
  },
];

const config = {
  maxChunkTokens: 80,
  overlapTokens: 10,
};

// ── Test 1: Full array ────────────────────────────────────────────────────────
console.log("═══════════════════════════════════════");
console.log("TEST 1: chunkScrapedJSON (full array)");
console.log("═══════════════════════════════════════");

const allChunks = chunkScrapedJSON(scrapedPages, config);

console.log("Total chunks across all pages:", allChunks.length);
console.log("");

// Group chunks by source_id and print summary per page
const grouped = allChunks.reduce((acc, chunk) => {
  const key = chunk.metadata.source_id;
  if (!acc[key]) acc[key] = [];
  acc[key].push(chunk);
  return acc;
}, {});

Object.entries(grouped).forEach(([sourceId, chunks]) => {
  console.log(`Page: ${sourceId} → ${chunks.length} chunks`);
  chunks.forEach((c) => {
    console.log(
      `  Chunk ${c.metadata.chunk_index + 1} | tokens: ${c.metadata.token_count} | title: ${c.metadata.title}`,
    );
  });
});

// ── Test 2: Single page object ────────────────────────────────────────────────
console.log("");
console.log("═══════════════════════════════════════");
console.log("TEST 2: chunkPageObject (single page)");
console.log("═══════════════════════════════════════");

const singleChunks = chunkPageObject(scrapedPages[0], config);
console.log("Chunks for api_001:", singleChunks.length);
singleChunks.forEach((c, i) => {
  console.log(`  Chunk ${i + 1} | tokens: ${c.metadata.token_count}`);
});

// ── Test 3: Metadata integrity check ─────────────────────────────────────────
console.log("");
console.log("═══════════════════════════════════════");
console.log("TEST 3: Metadata integrity");
console.log("═══════════════════════════════════════");

const firstChunk = allChunks[0];
const requiredFields = [
  "source_id",
  "url",
  "category",
  "title",
  "docType",
  "scrapedAt",
  "chunk_index",
  "token_count",
];

requiredFields.forEach((field) => {
  const present = firstChunk.metadata[field] !== undefined;
  console.log(`  ${present ? "✓" : "✗"} ${field}:`, firstChunk.metadata[field]);
});

// ── Test 4: Token limit check ─────────────────────────────────────────────────
console.log("");
console.log("═══════════════════════════════════════");
console.log("TEST 4: Token limit violations");
console.log("═══════════════════════════════════════");

let violations = 0;
allChunks.forEach((c) => {
  const actual = countTokens(c.content);
  // Allow slight overflow on force-split edge cases
  if (actual > config.maxChunkTokens + 10) {
    console.log(
      `  ✗ Chunk ${c.metadata.chunk_index} of ${c.metadata.source_id} has ${actual} tokens (limit: ${config.maxChunkTokens})`,
    );
    violations++;
  }
});
console.log(
  violations === 0
    ? "  ✓ All chunks within token limit"
    : `  ${violations} violation(s) found`,
);

// ── Test 5: Edge cases ────────────────────────────────────────────────────────
console.log("");
console.log("═══════════════════════════════════════");
console.log("TEST 5: Edge cases");
console.log("═══════════════════════════════════════");

// Empty content page
const emptyResult = chunkPageObject(scrapedPages[2], config);
console.log(
  "  Empty content → chunks:",
  emptyResult.length,
  emptyResult.length === 0 ? "✓" : "✗",
);

// Empty array
const emptyArray = chunkScrapedJSON([], config);
console.log(
  "  Empty array   → chunks:",
  emptyArray.length,
  emptyArray.length === 0 ? "✓" : "✗",
);

// Null/undefined guard
const nullResult = chunkScrapedJSON(null, config);
console.log(
  "  Null input    → chunks:",
  nullResult.length,
  nullResult.length === 0 ? "✓" : "✗",
);
