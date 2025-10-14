const dotenv = require("dotenv");
const { Pool } = require("pg");
const { logConversation } = require("../db.js");
const { searchPayPalWeb, shouldUseWebSearch, combineHybridAndWebResults } = require("./webSearchService.js");
dotenv.config();

const PINECONE_INDEX = process.env.PINECONE_INDEX;
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AGENT_NAME = process.env.AGENT_NAME || "";
const TOP_K = 3;

// PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'paypalAgent',
  password: process.env.POSTGRES_PASSWORD || 'your_password_here',
  port: 5432,
});

// ===== UTILITIES =====
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

function containsProfanity(text) {
  if (!text) return false;
  const blacklist = [
    "dumb", "stupid", "idiot", "shut up", "suck", "wtf", "hell", "crap", "damn",
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

function classifyIssueType(text) {
  const t = String(text || "").toLowerCase();
  
  // Check for general greetings and identity questions first
  if (/hello|hi|hey|good morning|good afternoon|good evening|greetings/.test(t)) return "greeting";
  if (/who are you|what are you|your name|introduce|introduction/.test(t)) return "identity";
  if (/help|support|assistance|how can you help/.test(t)) return "general_help";
  
  // Check for specific issue types
  if (/chargeback|dispute|case|resolution/.test(t)) return "dispute";
  if (/limit|limitation|restricted|hold/.test(t)) return "account_limitation";
  if (/fee|fees|charge|rate|pricing/.test(t)) return "fees";
  if (/refund|refunds|return/.test(t)) return "refund";
  if (/payment|transfer|send|receive|payout/.test(t)) return "payment_issue";
  
  // Default to general help instead of payment issue
  return "general_help";
}

function formatStructuredResponse(issueType, includeDisclaimer, rawAnswer) {
  const disclaimer = includeDisclaimer
    ? "This is general guidance based on PayPal documentation. For account‑specific issues or legal advice, please contact PayPal support."
    : "";
  
  // For greetings and identity questions, don't show "Issue:" prefix
  if (issueType === "greeting" || issueType === "identity") {
    return [
      rawAnswer,
      disclaimer && `Disclaimer: ${disclaimer}`
    ].filter(Boolean).join("\n\n");
  }
  
  // For other issue types, show the structured format
  return [
    `Issue: ${issueType.replace(/_/g, " ")}`,
    rawAnswer,
    disclaimer && `Disclaimer: ${disclaimer}`
  ].filter(Boolean).join("\n\n");
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

// ===== HYBRID SEARCH =====
async function hybridSearch(query, embedder, pineconeIndex, dbClient) {
  console.log("🔍 Running hybrid search...");
  
  // 1. Semantic Search (Pinecone)
  console.log("   📊 Semantic search (Pinecone)...");
  const output = await embedder(query, { pooling: "mean", normalize: true });
  const queryEmbedding = Array.from(output.data);
  
  // Resize to 1024 dimensions for Pinecone
  const queryEmbedding1024 = resizeVector768to1024(queryEmbedding);
  
  const semanticResults = await pineconeIndex.namespace(PINECONE_NAMESPACE).query({
    vector: queryEmbedding1024,
    topK: TOP_K,
    includeMetadata: true
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
  const combinedResults = combineSearchResults(semanticResults.matches, lexicalResults.rows);
  
  return combinedResults;
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
      source: 'semantic'
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
      existing.combinedScore = (existing.semanticScore * 0.7) + (lexicalScore * 0.3);
      existing.source = 'hybrid';
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
          preview: result.text.slice(0, 200) + '...'
        },
        source: 'lexical'
      });
    }
  });
  
  // Sort by combined score and return top results
  return Array.from(combined.values())
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, TOP_K);
}

// ===== CHAT HISTORY MANAGEMENT =====
async function saveChatMessage(sessionId, role, content, metadata = {}) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO chat_history (session_id, role, content, metadata, created_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [sessionId, role, content, JSON.stringify(metadata)]
    );
  } catch (error) {
    console.error('Error saving chat message:', error);
  } finally {
    client.release();
  }
}

async function getChatHistory(sessionId, limit = 10) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT role, content, metadata, created_at 
       FROM chat_history 
       WHERE session_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [sessionId, limit]
    );
    return result.rows.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Error getting chat history:', error);
    return [];
  } finally {
    client.release();
  }
}

// ===== MAIN QUERY HANDLER =====
async function handleQuery(query, sessionId) {
  const { Pinecone } = await import("@pinecone-database/pinecone");
  const { pipeline } = await import("@xenova/transformers");
  const { GoogleGenerativeAI } = await import("@google/generative-ai");

  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pinecone.index(PINECONE_INDEX);
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const embedder = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");

  // Connect to PostgreSQL
  const dbClient = await pool.connect();

  try {
    const sentiment = await detectSentiment(query, genAI);
    const issueType = classifyIssueType(query);
    
    // Save user message to chat history
    if (sessionId) {
      await saveChatMessage(sessionId, 'user', query, { sentiment, issueType });
    }

    // Run hybrid search
    const hybridResults = await hybridSearch(query, embedder, index, dbClient);
    
    // Check if we need web search for recent/current information
    let webResults = [];
    let finalSearchResults = hybridResults;
    
    if (shouldUseWebSearch(query)) {
      console.log("🌐 Triggering web search for recent information...");
      webResults = await searchPayPalWeb(query);
      
      if (webResults.length > 0) {
        // Combine hybrid and web results
        finalSearchResults = combineHybridAndWebResults(hybridResults, webResults);
        console.log(`✅ Combined ${hybridResults.length} hybrid + ${webResults.length} web results`);
      }
    }

    if (finalSearchResults.length === 0) {
      return { answer: "No relevant info found. Please contact PayPal support.", sentiment };
    }

    // Get chat history for context
    const chatHistory = sessionId ? await getChatHistory(sessionId, 5) : [];
    
    // Prepare context from retrieved chunks
    const context = finalSearchResults.map((chunk, idx) => {
      const content = chunk.metadata?.text || chunk.metadata?.preview || 'No content available';
      const sourceType = chunk.source === 'web_search' ? 'Web Search' : chunk.source;
      return `[Source ${idx + 1} - ${sourceType}]: ${content}`;
    }).join("\n\n");

    // Build conversation context
    const conversationContext = chatHistory.length > 0 
      ? `\n\nPrevious conversation:\n${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
      : '';

    // Decide whether to introduce based on user's message
    const lowerQ = String(query || "").toLowerCase();
    const introduceTriggers = [
      /what\s+is\s+your\s+name/, /who\s+are\s+you/, /your\s+name\??/,
      /hello|hi|hey[,!\s]*\s*(agent|assistant)?/, /agent[,!\s]*\b/,
    ];
    const shouldIntroduce = introduceTriggers.some((re) => re.test(lowerQ));
    const sawProfanity = containsProfanity(query);

    let systemInstruction = `You are ${AGENT_NAME}, a helpful PayPal customer support agent.`;
    if (shouldIntroduce) {
      systemInstruction += ` If the user asked or greeted, briefly introduce yourself as ${AGENT_NAME}.`;
    } else {
      systemInstruction += ` Do not introduce yourself unless explicitly asked or greeted.`;
    }
    if (sentiment.sentiment === "frustrated" || sawProfanity) {
      systemInstruction += ` The customer may be upset. Start with one short, kind, de‑escalating sentence (empathetic and professional), avoid mirroring aggression, then provide a clear helpful answer.`;
    } else if (sentiment.sentiment === "concerned") {
      systemInstruction += ` The customer is concerned. Be reassuring and calm.`;
    }

    const prompt = `${systemInstruction}

Context from PayPal documentation (Hybrid Search Results):
${context}${conversationContext}

Customer: ${query}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const modelAnswer = response.text();

    const includeDisclaimer = (finalSearchResults[0]?.combinedScore || 0) < 0.5 || /account|legal|attorney|law|court|subpoena/i.test(query);
    const finalAnswer = formatStructuredResponse(issueType, includeDisclaimer, modelAnswer);

    // Save assistant response to chat history
    if (sessionId) {
      await saveChatMessage(sessionId, 'assistant', finalAnswer, { 
        sentiment, 
        issueType, 
        confidence: finalSearchResults[0]?.combinedScore || 0,
        searchType: finalSearchResults[0]?.source || 'unknown'
      });
    }

    // Log conversation
    logConversation({
      sessionId: sessionId || null,
      query,
      issueType,
      sentiment,
      topCitations: finalSearchResults.map((c) => ({ 
        source: c.metadata?.source || 'Unknown', 
        channel: c.source, 
        isPolicy: isPolicyLikeSource(c.metadata?.source), 
        score: c.combinedScore 
      })),
    });

    return {
      answer: finalAnswer,
      sentiment,
      confidence: Math.min(100, Math.max(0, Math.round((finalSearchResults[0]?.combinedScore || 0) * 100))),
      citations: finalSearchResults.map((c, idx) => ({
        label: `Source ${idx + 1}`,
        source: c.metadata?.source || "docs",
        isPolicy: isPolicyLikeSource(c.metadata?.source),
        channel: c.source,
      })),
      issueType,
      disclaimer: includeDisclaimer,
      searchType: finalSearchResults[0]?.source || 'unknown'
    };

  } catch (error) {
    console.error('Error in handleQuery:', error);
    return { 
      answer: "I'm sorry, I encountered an error processing your request. Please try again or contact PayPal support.", 
      sentiment: { sentiment: "neutral", confidence: "low" } 
    };
  } finally {
    dbClient.release();
  }
}

module.exports = { handleQuery };