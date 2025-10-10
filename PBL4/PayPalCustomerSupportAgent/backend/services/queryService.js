const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const MiniSearch = require("minisearch");
const { logConversation } = require("../db.js");
dotenv.config();

const PINECONE_INDEX = process.env.PINECONE_INDEX;
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AGENT_NAME = process.env.AGENT_NAME || "Ashok Limbu";
const TOP_K = 3;

//Hybrid Search (BM25 + Vectors) helpers
let miniSearchIndex = null;
let miniSearchDocs = [];

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

//  for sentiment
function containsProfanity(text) {
  if (!text) return false;
  const blacklist = [
    "dumb",
    "stupid",
    "idiot",
    "shut up",
    "suck",
    "wtf",
    "hell",
    "crap",
    "damn",
  ];
  const lower = String(text).toLowerCase();
  return blacklist.some((w) => {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (w.includes(" ")) {
      // For multi-word phrases, simple substring check is sufficient
      return lower.includes(w);
    }
    const re = new RegExp(`\\b${escaped}\\b`, "i");
    return re.test(lower);
  });
}

async function detectSentiment(text, genAI) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = [
      "Classify the user's tone strictly as one of: frustrated, concerned, neutral.",
      "Rules:",
      "- If there is profanity, insults, or harsh words (e.g., 'dumb', 'stupid', 'idiot'), classify as frustrated.",
      "- If the user expresses worry/uncertainty without rudeness, classify as concerned.",
      "- Otherwise, neutral.",
      "Return ONLY strict JSON with keys sentiment and confidence (high/medium/low).",
      "Example: {\"sentiment\":\"frustrated\",\"confidence\":\"high\"}",
      `Text: ${text}`
    ].join("\n");
    const result = await model.generateContent(prompt);
    const resp = await result.response;
    const raw = resp.text().trim();
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.sentiment === "string") {
      return parsed;
    }
  } catch (_) {
    // fallthrough to default
  }
  if (containsProfanity(text)) {
    return { sentiment: "frustrated", confidence: "high" };
  }
  return { sentiment: "neutral", confidence: "low" };
}

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

// In-memory session store (simple Tier 2 memory); can be swapped to Mongo later
const sessionMemory = new Map(); // sessionId -> { messages: [...], issueType: string }

function classifyIssueType(text) {
  const t = String(text || "").toLowerCase();
  if (/chargeback|dispute|case|resolution/.test(t)) return "dispute";
  if (/limit|limitation|restricted|hold/.test(t)) return "account_limitation";
  if (/fee|fees|charge|rate|pricing/.test(t)) return "fees";
  if (/refund|refunds|return/.test(t)) return "refund";
  if (/payment|transfer|send|receive|payout/.test(t)) return "payment_issue";
  return "payment_issue";
}

function formatStructuredResponse(issueType, includeDisclaimer, rawAnswer) {
  const disclaimer = includeDisclaimer
    ? "This is general guidance based on PayPal documentation. For account‑specific issues or legal advice, please contact PayPal support."
    : "";
  // Best effort: if model produced free-form text, keep it but prefix with structure headers
  return [
    `Issue: ${issueType.replace(/_/g, " ")}`,
    rawAnswer,
    disclaimer && `Disclaimer: ${disclaimer}`
  ].filter(Boolean).join("\n\n");
}

async function handleQuery(query, sessionId) {
  const { Pinecone } = await import("@pinecone-database/pinecone");
  const { pipeline } = await import("@xenova/transformers");
  const { GoogleGenerativeAI } = await import("@google/generative-ai");

  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pinecone.index(PINECONE_INDEX);
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const embedder = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");

  const sentiment = await detectSentiment(query, genAI);
  const issueType = classifyIssueType(query);
  if (sessionId) {
    const state = sessionMemory.get(sessionId) || { messages: [], issueType };
    state.messages.push({ role: "user", content: query });
    state.issueType = state.issueType || issueType;
    sessionMemory.set(sessionId, state);
  }
  const output = await embedder(query, { pooling: "mean", normalize: true });
  const queryEmbedding = Array.from(output.data);

  const searchResults = await index.namespace(PINECONE_NAMESPACE).query({
    vector: queryEmbedding,
    topK: TOP_K,
    includeMetadata: true
  });

  // Run BM25 keyword search (MiniSearch) alongside Pinecone
  const ms = ensureMiniSearchIndex();
  let bm25Results = [];
  if (ms) {
    bm25Results = ms.search(query, { combineWith: "AND" });
  }

  // Prepare candidate list combining both sources
  const alpha = 0.6; // semantic weight
  const beta = 0.4;  // keyword weight
  const policyBoost = 1.3; // boost for policy/legal exact matches on BM25

  const candidates = [];

  // Normalize Pinecone scores to 0..1 range from typical similarity (already 0..1)
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

  if (candidates.length === 0) {
    return { answer: "No relevant info found. Please contact PayPal support.", sentiment };
  }

  // Combine scores with policy weighting on BM25 channel
  for (const c of candidates) {
    const bm25Weighted = c.isPolicy ? c.scoreBM25 * policyBoost : c.scoreBM25;
    c.combined = alpha * c.scoreSemantic + beta * bm25Weighted;
  }
  candidates.sort((a, b) => (b.combined || 0) - (a.combined || 0));

  const top = candidates.slice(0, TOP_K);
  const context = top.map((c, idx) => `[Source ${idx + 1}] (${c.source || "docs"}): ${c.text}`).join("\n\n");

  // Decide whether to introduce based on user's message (name/greeting triggers)
  const lowerQ = String(query || "").toLowerCase();
  const introduceTriggers = [
    /what\s+is\s+your\s+name/,
    /who\s+are\s+you/,
    /your\s+name\??/,
    /hello|hi|hey[,!\s]*\s*(agent|assistant)?/,
    /agent[,!\s]*\b/,
  ];
  const shouldIntroduce = introduceTriggers.some((re) => re.test(lowerQ));

  const sawProfanity = containsProfanity(query);

  let systemInstruction = `You are ${AGENT_NAME}, a helpful PayPal customer support agent.`;
  if (shouldIntroduce) {
    systemInstruction += ` If the user asked or greeted, briefly introduce yourself as ${AGENT_NAME}.`;
  } else {
    systemInstruction += ` Do not introduce yourself unless explicitly asked or greeted.`;
  }
  if (sentiment.sentiment === "frustrated" || sawProfanity)
    systemInstruction += ` The customer may be upset. Start with one short, kind, de‑escalating sentence (empathetic and professional), avoid mirroring aggression, then provide a clear helpful answer.`;
  else if (sentiment.sentiment === "concerned")
    systemInstruction += ` The customer is concerned. Be reassuring and calm.`;

  const prompt = `${systemInstruction}\n\nContext:\n${context}\n\nCustomer: ${query}\n`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const response = await result.response;

  const modelAnswer = response.text();
  const includeDisclaimer = (top[0]?.combined || 0) < 0.5 || /account|legal|attorney|law|court|subpoena/i.test(query);
  const finalAnswer = formatStructuredResponse(issueType, includeDisclaimer, modelAnswer);

  // fire-and-forget logging
  logConversation({
    sessionId: sessionId || null,
    query,
    issueType,
    sentiment,
    topCitations: top.map((c) => ({ source: c.source, channel: c.from, isPolicy: c.isPolicy, score: c.combined })),
  });

  return {
    answer: finalAnswer,
    sentiment,
    confidence: Math.min(100, Math.max(0, Math.round((top[0]?.combined || 0) * 100))),
    citations: top.map((c, idx) => ({
      label: `Source ${idx + 1}`,
      source: c.source || "docs",
      isPolicy: !!c.isPolicy,
      channel: c.from,
    })),
    issueType,
    disclaimer: includeDisclaimer,
  };
}

module.exports = { handleQuery };
