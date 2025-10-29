// Hybrid Search Q&A Agent - PostgreSQL BM25 + Pinecone Semantic
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline } from "@xenova/transformers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import readline from "readline";
import pool from "./src/database.js";

dotenv.config();

// ===== CONFIG =====
const PINECONE_INDEX = process.env.PINECONE_INDEX;
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TOP_K = 3;

if (!GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in .env file");
  console.error(
    "Get your free API key at: https://makersuite.google.com/app/apikey"
  );
  process.exit(1);
}

// ===== UTILITIES =====
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
      "Classify the user's tone as one of: frustrated, concerned, neutral.",
      "Rules:",
      "- If there is profanity, insults, or harsh words (e.g., 'dumb', 'stupid', 'idiot'), classify as frustrated.",
      "- If the user expresses worry, uncertainty, panic, or uses emotional language (e.g., 'forgot', 'lost', 'help', 'urgent', '😭', '!!!'), classify as concerned.",
      "- If the user is asking a simple question without emotion, classify as neutral.",
      "Return ONLY strict JSON with keys sentiment and confidence (high/medium/low).",
      'Example: {"sentiment":"concerned","confidence":"high"}',
      `Text: ${text}`,
    ].join("\n");
    const result = await model.generateContent(prompt);
    const resp = await result.response;
    const raw = resp.text().trim();

    // Handle markdown-wrapped JSON response
    let jsonText = raw;
    if (raw.includes("```json")) {
      jsonText = raw.split("```json")[1].split("```")[0].trim();
    } else if (raw.includes("```")) {
      jsonText = raw.split("```")[1].split("```")[0].trim();
    }

    const parsed = JSON.parse(jsonText);
    if (parsed && typeof parsed.sentiment === "string") {
      return parsed;
    }
  } catch (error) {
    console.error("❌ Sentiment detection failed:", error.message);
    console.log("📝 Raw response:", error);
  }
  if (containsProfanity(text)) {
    return { sentiment: "frustrated", confidence: "high" };
  }
  return { sentiment: "neutral", confidence: "low" };
}

// ===== HYBRID SEARCH =====
async function hybridSearch(query, embedder, pineconeIndex, dbClient) {
  console.log("🔍 Running hybrid search...");

  // 1. Semantic Search (Pinecone)
  console.log("   📊 Semantic search (Pinecone)...");
  const output = await embedder(query, { pooling: "mean", normalize: true });
  const queryEmbedding = Array.from(output.data);

  // Resize to 1024 dimensions for Pinecone
  const queryEmbedding1024 = resizeVector768to1024(queryEmbedding);

  const semanticResults = await pineconeIndex
    .namespace(PINECONE_NAMESPACE)
    .query({
      vector: queryEmbedding1024,
      topK: TOP_K,
      includeMetadata: true,
    });

  // 2. Lexical Search (PostgreSQL BM25)
  console.log("   🔤 Lexical search (PostgreSQL BM25)...");
  const lexicalQuery = `
    SELECT 
      id, source_file, original_index, chunk_index, text,
      ts_rank(text_search_vector, plainto_tsquery($1)) as rank
    FROM chunks 
    WHERE text_search_vector @@ plainto_tsquery($1)
    ORDER BY rank DESC
    LIMIT $2
  `;

  const lexicalResults = await dbClient.query(lexicalQuery, [query, TOP_K]);

  // 3. Combine and score results
  console.log("   🔄 Combining results...");
  const combinedResults = combineSearchResults(
    semanticResults.matches,
    lexicalResults.rows
  );

  return combinedResults;
}

// Function to resize 768-dim vector to 1024-dim
function resizeVector768to1024(vector768) {
  const vector1024 = [...vector768];
  const extra = 1024 - 768;
  for (let i = 0; i < extra; i++) {
    const scale = 0.1 + (i % 10) * 0.01;
    const sourceIndex = i % 768;
    vector1024.push(vector768[sourceIndex] * scale);
  }
  return vector1024;
}

// Combine semantic and lexical results
function combineSearchResults(semanticResults, lexicalResults) {
  const combined = new Map();

  // Add semantic results (weight: 0.7)
  semanticResults.forEach((result, index) => {
    const id = result.id;
    combined.set(id, {
      ...result,
      semanticScore: result.score,
      lexicalScore: 0,
      combinedScore: result.score * 0.7,
      source: "semantic",
    });
  });

  // Add lexical results (weight: 0.3)
  lexicalResults.forEach((result, index) => {
    const id = `${result.source_file}:${result.original_index}:${result.chunk_index}`;
    const lexicalScore = result.rank;

    if (combined.has(id)) {
      // Update existing result
      const existing = combined.get(id);
      existing.lexicalScore = lexicalScore;
      existing.combinedScore =
        existing.semanticScore * 0.7 + lexicalScore * 0.3;
      existing.source = "hybrid";
    } else {
      // Add new result
      combined.set(id, {
        id,
        score: lexicalScore,
        semanticScore: 0,
        lexicalScore: lexicalScore,
        combinedScore: lexicalScore * 0.3,
        metadata: {
          source: result.source_file,
          original_index: result.original_index,
          chunk_index: result.chunk_index,
          text: result.text,
          preview: result.text.slice(0, 200) + "...",
        },
        source: "lexical",
      });
    }
  });

  // Sort by combined score and return top results
  return Array.from(combined.values())
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, TOP_K);
}

async function generateAnswer(query, chunks, sentiment, genAI) {
  if (!chunks || chunks.length === 0) {
    return "I couldn't find relevant information in the knowledge base. Please contact PayPal support directly.";
  }

  // Prepare context from retrieved chunks
  const context = chunks
    .map((chunk, idx) => {
      const content =
        chunk.metadata?.text ||
        chunk.metadata?.preview ||
        "No content available";
      return `[Source ${idx + 1} - ${chunk.source}]: ${content}`;
    })
    .join("\n\n");

  // Build system prompt based on sentiment
  let systemInstruction = `You are a helpful PayPal customer support agent. Answer questions clearly and concisely based on the provided context.`;

  if (sentiment.sentiment === "frustrated") {
    systemInstruction += ` The customer appears frustrated. Be extra empathetic, apologize for their inconvenience, and provide clear, actionable steps. Start with an empathetic acknowledgment.`;
  } else if (sentiment.sentiment === "concerned") {
    systemInstruction += ` The customer seems concerned. Be reassuring and thorough in your explanation.`;
  }

  const prompt = `${systemInstruction}

Context from PayPal documentation (Hybrid Search Results):
${context}

Customer Question: ${query}

Please provide a clear, helpful answer (2-3 paragraphs maximum) based on the context above. Be conversational and friendly. If the context doesn't fully answer the question, mention that and suggest contacting PayPal support.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini:", error.message);
    return chunks[0].metadata?.text || "Unable to generate response.";
  }
}

// ===== MAIN =====
async function main() {
  console.log(
    "🚀 Initializing PayPal Support Agent with HYBRID SEARCH (PostgreSQL BM25 + Pinecone)...\n"
  );

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  const index = pinecone.index(PINECONE_INDEX);

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  console.log("🔧 Loading embedding model...");
  const embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-mpnet-base-v2"
  );
  console.log("✅ Model loaded!\n");

  // Connect to PostgreSQL
  const dbClient = await pool.connect();
  console.log("✅ PostgreSQL connected!\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("=".repeat(70));
  console.log("🔍 PayPal Customer Support Q&A Agent (HYBRID SEARCH)");
  console.log("   📊 Semantic (Pinecone) + 🔤 Lexical (PostgreSQL BM25)");
  console.log("=".repeat(70));
  console.log("Ask me anything about PayPal! (Type 'exit' to quit)\n");

  const askQuestion = () => {
    rl.question("❓ Your question: ", async (query) => {
      if (query.toLowerCase() === "exit" || query.toLowerCase() === "quit") {
        console.log("\n👋 Thank you for using PayPal Support Agent. Goodbye!");
        dbClient.release();
        rl.close();
        process.exit(0);
      }

      if (!query.trim()) {
        console.log("⚠️  Please enter a valid question.\n");
        askQuestion();
        return;
      }

      try {
        console.log("\n🔍 Running hybrid search...");

        const sentiment = await detectSentiment(query, genAI);
        if (sentiment.sentiment === "frustrated") {
          console.log(
            "🚨 ALERT: Frustrated customer detected! Priority support needed."
          );
          console.log(
            `   Sentiment: ${sentiment.sentiment} | Confidence: ${sentiment.confidence}\n`
          );
        } else if (sentiment.sentiment === "concerned") {
          console.log("⚠️  Customer may be concerned. Handle with care.\n");
        }

        const searchResults = await hybridSearch(
          query,
          embedder,
          index,
          dbClient
        );

        console.log("🤖 Generating answer with Gemini...\n");

        const answer = await generateAnswer(
          query,
          searchResults,
          sentiment,
          genAI
        );

        console.log("💡 Answer:");
        console.log("-".repeat(60));
        console.log(answer);
        console.log("-".repeat(60));

        if (searchResults.length > 0) {
          console.log(
            `\n📊 Combined Score: ${(
              searchResults[0].combinedScore * 100
            ).toFixed(1)}%`
          );
          console.log(
            `🎯 Retrieved from: ${
              searchResults[0].metadata?.source || "Unknown"
            }`
          );
          console.log(`🔍 Search Type: ${searchResults[0].source}`);
        }

        console.log("\n");
        askQuestion();
      } catch (error) {
        console.error("❌ Error processing query:", error.message);
        console.log("\n");
        askQuestion();
      }
    });
  };

  askQuestion();
}

main().catch((err) => {
  console.error("💥 Fatal error:", err);
  process.exit(1);
});
