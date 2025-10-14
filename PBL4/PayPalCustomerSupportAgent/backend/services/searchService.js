const fs = require("fs");
const path = require("path");
const MiniSearch = require("minisearch");

// Check if source is policy-like (legal/terms documents)
function isPolicyLikeSource(sourceName) {
  const lower = String(sourceName || "").toLowerCase();
  return (
    lower.includes("user_agreement") ||
    lower.includes("legal") ||
    lower.includes("seller_protection") ||
    lower.includes("buyer_protection") ||
    lower.includes("fees")
  );
}

// Parse chunk JSON text into plain text
function parseChunkJsonText(chunkJsonString) {
  // chunks.json stores a JSON string in field "text"; normalize to plain text
  try {
    const obj = JSON.parse(chunkJsonString);
    // Known shapes: { sections: [...] } OR { questions: [...] } OR long plain text
    if (obj.sections && Array.isArray(obj.sections)) {
      return obj.sections
        .map((s) => {
          if (s.type === "faq" && Array.isArray(s.content)) {
            return s.content
              .map((qa) => `${qa.question || ""}\n${qa.answer || qa.content || ""}`)
              .join("\n\n");
          }
          return [s.title, s.content].filter(Boolean).join("\n");
        })
        .join("\n\n");
    }
    if (obj.questions && Array.isArray(obj.questions)) {
      return obj.questions.map((q) => `${q.question || ""}\n${q.content || ""}`).join("\n\n");
    }
    if (obj.content) return String(obj.content);
    if (obj.text) return String(obj.text);
    return JSON.stringify(obj);
  } catch (_) {
    return chunkJsonString;
  }
}

// Parse content preview from metadata
function parseContent(preview) {
  try {
    const parsed = JSON.parse(preview);
    if (parsed.questions && Array.isArray(parsed.questions)) {
      return parsed.questions.map(q => q.content).join("\n\n");
    }
    if (parsed.content) return parsed.content;
    if (parsed.text) return parsed.text;
    return JSON.stringify(parsed);
  } catch {
    return preview;
  }
}

// Hybrid Search (BM25 + Vectors) helpers
let miniSearchIndex = null;
let miniSearchDocs = [];

// Initialize MiniSearch index for BM25 search
function ensureMiniSearchIndex() {
  if (miniSearchIndex) return miniSearchIndex;

  const chunksPath = path.resolve(__dirname, "../../scraper/src/chunkData/chunks.json");
  let raw;
  try {
    raw = fs.readFileSync(chunksPath, "utf-8");
  } catch (_) {
    // If chunks are not available, keep index null; hybrid will fall back to vectors only
    return null;
  }
  let chunks;
  try {
    chunks = JSON.parse(raw);
  } catch {
    return null;
  }

  // Build search docs
  miniSearchDocs = chunks.map((c, idx) => {
    const plain = parseChunkJsonText(c.text || "");
    const doc = {
      id: `${c.source || "src"}:${c.original_index}:${c.chunk_index}:${idx}`,
      source: c.source,
      text: plain,
      isPolicy: isPolicyLikeSource(c.source),
    };
    return doc;
  });

  const ms = new MiniSearch({
    fields: ["text"],
    storeFields: ["source", "text", "isPolicy"],
    searchOptions: {
      boost: { text: 2 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
  ms.addAll(miniSearchDocs);
  miniSearchIndex = ms;
  return miniSearchIndex;
}

// Perform hybrid search combining vector and BM25 results
async function performHybridSearch(queryEmbedding, query, index, namespace, topK = 3) {
  // Vector search with Pinecone
  const searchResults = await index.namespace(namespace).query({
    vector: queryEmbedding,
    topK: topK,
    includeMetadata: true
  });

  // BM25 keyword search (MiniSearch)
  const ms = ensureMiniSearchIndex();
  let bm25Results = [];
  if (ms) {
    bm25Results = ms.search(query, { combineWith: "AND" });
  }

  // Combine results with scoring
  const alpha = 0.6; // semantic weight
  const beta = 0.4;  // keyword weight
  const policyBoost = 1.3; // boost for policy/legal exact matches on BM25

  const candidates = [];

  // Add Pinecone results
  const pineconeMatches = Array.isArray(searchResults.matches) ? searchResults.matches : [];
  for (const m of pineconeMatches) {
    const semScore = typeof m.score === "number" ? m.score : 0;
    const preview = m?.metadata?.preview ? parseContent(m.metadata.preview) : "";
    candidates.push({
      from: "semantic",
      text: preview,
      source: m?.metadata?.source || "pinecone",
      isPolicy: isPolicyLikeSource(m?.metadata?.source),
      scoreSemantic: semScore,
      scoreBM25: 0,
    });
  }

  // Add BM25 results
  for (const r of bm25Results.slice(0, 10)) {
    const doc = r && r.id ? miniSearchDocs.find((d) => d.id === r.id) : null;
    if (!doc) continue;
    candidates.push({
      from: "bm25",
      text: doc.text,
      source: doc.source,
      isPolicy: !!doc.isPolicy,
      scoreSemantic: 0,
      scoreBM25: typeof r.score === "number" ? r.score : 0,
    });
  }

  // Combine scores with policy weighting
  for (const c of candidates) {
    const bm25Weighted = c.isPolicy ? c.scoreBM25 * policyBoost : c.scoreBM25;
    c.combined = alpha * c.scoreSemantic + beta * bm25Weighted;
  }
  
  candidates.sort((a, b) => (b.combined || 0) - (a.combined || 0));
  return candidates.slice(0, topK);
}

module.exports = {
  isPolicyLikeSource,
  parseChunkJsonText,
  parseContent,
  ensureMiniSearchIndex,
  performHybridSearch
};
