const dotenv = require("dotenv");
dotenv.config();

const PINECONE_INDEX = process.env.PINECONE_INDEX;
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AGENT_NAME = process.env.AGENT_NAME || "Ashok Limbu";
const TOP_K = 3;

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
  return blacklist.some((w) => lower.includes(w));
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

async function handleQuery(query) {
  const { Pinecone } = await import("@pinecone-database/pinecone");
  const { pipeline } = await import("@xenova/transformers");
  const { GoogleGenerativeAI } = await import("@google/generative-ai");

  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pinecone.index(PINECONE_INDEX);
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const embedder = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");

  const sentiment = await detectSentiment(query, genAI);
  const output = await embedder(query, { pooling: "mean", normalize: true });
  const queryEmbedding = Array.from(output.data);

  const searchResults = await index.namespace(PINECONE_NAMESPACE).query({
    vector: queryEmbedding,
    topK: TOP_K,
    includeMetadata: true
  });

  const chunks = searchResults.matches;
  if (!chunks || chunks.length === 0) {
    return { answer: "No relevant info found. Please contact PayPal support.", sentiment };
  }

  const context = chunks.map((chunk, idx) => `[Source ${idx + 1}]: ${parseContent(chunk.metadata.preview)}`).join("\n\n");

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

  return {
    answer: response.text(),
    sentiment,
    confidence: (chunks[0]?.score || 0) * 100,
  };
}

module.exports = { handleQuery };
