const dotenv = require("dotenv");
const { Pool } = require("pg");
const { logConversation } = require("../dbHybrid.js");
const MCPToolsService = require("../../mcp-server/src/index.js");
dotenv.config();

const PINECONE_INDEX = process.env.PINECONE_INDEX;
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AGENT_NAME = process.env.AGENT_NAME || "ashok limbu";
const TOP_K = 3;

// PostgreSQL connection pool
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "paypalAgent",
  password: process.env.POSTGRES_PASSWORD || "your_password_here",
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

function classifyIssueType(text) {
  const t = String(text || "").toLowerCase();

  // Check for general greetings and identity questions first
  if (/hello|hi|hey|good morning|good afternoon|good evening|greetings/.test(t))
    return "greeting";
  if (/who are you|what are you|your name|introduce|introduction/.test(t))
    return "identity";
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

function formatStructuredResponse(
  issueType,
  includeDisclaimer,
  rawAnswer,
  disclaimer
) {
  // For greetings and identity questions, don't show "Issue:" prefix
  if (issueType === "greeting" || issueType === "identity") {
    return rawAnswer;
  }

  // For other issue types, show the structured format
  return [
    `Issue: ${issueType.replace(/_/g, " ")}`,
    rawAnswer,
    includeDisclaimer && disclaimer && `Disclaimer: ${disclaimer}`,
  ]
    .filter(Boolean)
    .join("\n\n");
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
  console.log(" Semantic search (Pinecone)...");
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
  console.log("Lexical search (PostgreSQL BM25)...");
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

// ===== COMBINE HYBRID AND WEB RESULTS =====
function combineHybridAndWebResults(hybridResults, webResults) {
  console.log(
    `Combining ${hybridResults.length} hybrid + ${webResults.length} web results`
  );

  // Balanced combination logic - prioritize hybrid results for accuracy
  const allResults = [];

  // Add hybrid results with minimal score reduction
  hybridResults.forEach((result, index) => {
    allResults.push({
      ...result,
      source: "hybrid",
      adjustedScore: result.combinedScore * 0.9, // Minimal reduction
      priority: "documentation",
      originalScore: result.combinedScore,
    });
  });

  // Add web results with moderate scoring
  webResults.forEach((result, index) => {
    allResults.push({
      ...result,
      source: "web_search",
      adjustedScore: result.combinedScore * 1.1, // Moderate boost
      priority: "recent_info",
      isRecent: result.isRecent || false,
      isOfficial: result.isOfficial || false,
      originalScore: result.combinedScore,
    });
  });

  // Balanced sorting algorithm - prioritize quality over source
  allResults.sort((a, b) => {
    // Primary: adjusted score (quality first)
    if (Math.abs(a.adjustedScore - b.adjustedScore) > 0.1) {
      return b.adjustedScore - a.adjustedScore;
    }

    // Secondary: official sources first
    if (a.isOfficial !== b.isOfficial) {
      return b.isOfficial - a.isOfficial;
    }

    // Tertiary: recent content for recent queries
    if (a.isRecent !== b.isRecent) {
      return b.isRecent - a.isRecent;
    }

    // Quaternary: prefer hybrid for general queries, web for status queries
    const isStatusQuery = /(down|status|outage|maintenance|working)/i.test(
      hybridResults[0]?.metadata?.text || ""
    );
    if (isStatusQuery && a.source !== b.source) {
      return a.source === "web_search" ? -1 : 1;
    } else if (!isStatusQuery && a.source !== b.source) {
      return a.source === "hybrid" ? -1 : 1;
    }

    // Final: original combined score
    return b.originalScore - a.originalScore;
  });

  // Return top 3 results with balanced mix
  const topResults = allResults.slice(0, 3);

  console.log(
    `Final combined results: ${topResults.length} (${
      topResults.filter((r) => r.source === "web_search").length
    } web + ${topResults.filter((r) => r.source === "hybrid").length} hybrid)`
  );

  return topResults;
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
    console.error("Error saving chat message:", error);
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
    console.error("Error getting chat history:", error);
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
  const embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-mpnet-base-v2"
  );

  // Connect to PostgreSQL
  const dbClient = await pool.connect();

  try {
    // Initialize MCP Tools Service
    const mcpTools = new MCPToolsService();

    // Get triggered tools and their data
    const triggeredTools = await mcpTools.getTriggeredTools(query);
    const mcpData = {};

    // Get data from each triggered tool
    for (const tool of triggeredTools) {
      try {
        const toolResult = await mcpTools.getToolData(tool, query);
        if (toolResult) {
          mcpData[tool] = toolResult;
        }
      } catch (error) {
        console.error(`Error getting ${tool} data:`, error.message);
      }
    }

    const sentiment = await detectSentiment(query, genAI);
    const issueType = classifyIssueType(query);

    // Debug logging
    console.log("🎭 Sentiment detected:", sentiment);
    console.log("🏷️ Issue type:", issueType);

    // Save user message to chat history
    if (sessionId) {
      await saveChatMessage(sessionId, "user", query, { sentiment, issueType });
    }

    // Run hybrid search
    const hybridResults = await hybridSearch(query, embedder, index, dbClient);

    // Check if we have MCP web search results to combine with hybrid search
    let webResults = [];
    let finalSearchResults = hybridResults;

    if (
      mcpData.websearch &&
      mcpData.websearch.success &&
      mcpData.websearch.data
    ) {
      console.log("Using MCP web search results for recent information...");
      console.log(`Hybrid results before web search: ${hybridResults.length}`);
      console.log(
        `Hybrid result sources: ${hybridResults
          .map((r) => r.metadata?.source || "unknown")
          .join(", ")}`
      );

      webResults = mcpData.websearch.data;
      console.log(`🌐 MCP Web search returned: ${webResults.length} results`);

      if (webResults.length > 0) {
        console.log(
          `📊 Web result sources: ${webResults
            .map((r) => r.metadata?.title || r.metadata?.source || "unknown")
            .join(", ")}`
        );
        console.log(
          `📊 Web result links: ${webResults
            .map((r) => r.metadata?.link || "no-link")
            .join(", ")}`
        );

        // Combine hybrid and web results
        finalSearchResults = combineHybridAndWebResults(
          hybridResults,
          webResults
        );
        console.log(
          `✅ Combined ${hybridResults.length} hybrid + ${webResults.length} web results`
        );
        console.log(
          `📊 Final result sources: ${finalSearchResults
            .map((r) => r.source)
            .join(", ")}`
        );
      } else {
        console.log(
          "⚠️ No MCP web search results found, using hybrid results only"
        );
        finalSearchResults = hybridResults;
      }
    } else {
      console.log("📚 Using hybrid search only (no MCP web search results)");
    }

    if (finalSearchResults.length === 0) {
      return {
        answer: "No relevant info found. Please contact PayPal support.",
        sentiment,
      };
    }

    // Get chat history for context
    const chatHistory = sessionId ? await getChatHistory(sessionId, 5) : [];

    // Prepare context from retrieved chunks
    const context = finalSearchResults
      .map((chunk, idx) => {
        const content =
          chunk.metadata?.text ||
          chunk.metadata?.preview ||
          "No content available";
        return `[Source ${idx + 1} - ${chunk.source}]: ${content}`;
      })
      .join("\n\n");

    // Add MCP tool data to context
    let mcpContext = "";
    if (Object.keys(mcpData).length > 0) {
      mcpContext = "\n\nAdditional Real-time Information:\n";
      for (const [tool, data] of Object.entries(mcpData)) {
        if (data.success && data.message) {
          mcpContext += `\n[${tool.toUpperCase()} TOOL]: ${data.message}`;
        }
      }
    }

    // Build conversation context
    const conversationContext =
      chatHistory.length > 0
        ? `\n\nPrevious conversation:\n${chatHistory
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join("\n")}`
        : "";

    // Decide whether to introduce based on user's message
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

    let systemInstruction = `You are ${AGENT_NAME}, a helpful PayPal customer support agent. Keep your responses concise and under 150 words.`;
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

    // Add response length constraints
    systemInstruction += `\n\nIMPORTANT RESPONSE GUIDELINES:
    - Keep responses under 150 words
    - Be direct and concise
    - Focus on the most important information
    - Use bullet points for multiple items
    - Avoid lengthy explanations unless specifically requested`;

    // Enhanced instructions for hybrid + MCP tools integration
    const hasWebResults = finalSearchResults.some(
      (result) => result.source === "web_search"
    );
    const hasHybridResults = finalSearchResults.some(
      (result) => result.source === "hybrid"
    );
    const hasMCPTools = Object.keys(mcpData).length > 0;

    if (hasMCPTools) {
      systemInstruction += `\n\nIMPORTANT: You have access to real-time tool data in addition to documentation:
      - PRIORITIZE real-time tool data for current status, currency conversions, and live information
      - Use documentation for general policies, procedures, and detailed explanations
      - Combine tool data with documentation to provide comprehensive answers
      - Always mention when you're using real-time data vs documentation`;
    } else if (hasWebResults && hasHybridResults) {
      systemInstruction += `\n\nIMPORTANT: You have access to both documentation (hybrid search) and recent web information. Use this combined approach:
      - PRIORITIZE recent web information for current status, outages, fees, and recent changes
      - Use documentation for general policies, procedures, and detailed explanations
      - For status/outage queries, clearly state current status based on web search results
      - When web search and documentation conflict, prioritize the most recent information
      - Always mention the source type (Recent Web Information vs Documentation) in your response
      - Combine both sources to provide comprehensive and accurate answers`;
    } else if (hasWebResults) {
      systemInstruction += `\n\nIMPORTANT: You have access to recent web search information. When using this information:
      - Prioritize recent and official PayPal sources marked as [OFFICIAL] and [CURRENT]
      - For status/outage queries, clearly state if PayPal is currently experiencing issues
      - Mention that this is recent information from web search
      - Be cautious about information accuracy and suggest contacting PayPal support for verification`;
    } else if (hasHybridResults) {
      systemInstruction += `\n\nIMPORTANT: You have access to PayPal documentation. When using this information:
      - Use the documentation to provide accurate, detailed answers
      - For current status or recent changes, suggest checking PayPal's official status page
      - Mention that this information is from official documentation`;
    }

    const prompt = `${systemInstruction}

Context from PayPal documentation (Hybrid Search Results):
${context}${mcpContext}${conversationContext}

Customer: ${query}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let modelAnswer = response.text();

    // Ensure response is under 150 words
    const words = modelAnswer.split(" ");
    if (words.length > 150) {
      modelAnswer = words.slice(0, 150).join(" ") + "...";
    }

    const includeDisclaimer =
      (finalSearchResults[0]?.combinedScore || 0) < 0.5 ||
      /account|legal|attorney|law|court|subpoena/i.test(query);
    const disclaimerText = includeDisclaimer
      ? "This is general information based on available documentation. For specific account issues or legal matters, please contact PayPal support directly."
      : null;
    const finalAnswer = formatStructuredResponse(
      issueType,
      includeDisclaimer,
      modelAnswer,
      disclaimerText
    );

    // Save assistant response to chat history
    if (sessionId) {
      await saveChatMessage(sessionId, "assistant", finalAnswer, {
        sentiment,
        issueType,
        confidence: finalSearchResults[0]?.combinedScore || 0,
        searchType: finalSearchResults[0]?.source || "unknown",
      });
    }

    // Log conversation
    logConversation({
      sessionId: sessionId || null,
      query,
      issueType,
      sentiment,
      topCitations: finalSearchResults.map((c) => ({
        source: c.metadata?.source || "Unknown",
        channel: c.source,
        isPolicy: isPolicyLikeSource(c.metadata?.source),
        score: c.combinedScore,
      })),
    });

    return {
      answer: finalAnswer,
      sentiment,
      confidence: Math.min(
        100,
        Math.max(
          0,
          Math.round((finalSearchResults[0]?.combinedScore || 0) * 100)
        )
      ),
      citations: finalSearchResults.map((c, idx) => ({
        label: `Source ${idx + 1}`,
        source: c.metadata?.source || c.metadata?.title || "docs",
        isPolicy: isPolicyLikeSource(c.metadata?.source),
        channel: c.source,
        isOfficial: c.isOfficial || false,
        isRecent: c.isRecent || false,
        priority: c.priority || "unknown",
      })),
      issueType,
      disclaimer: includeDisclaimer,
      searchType: finalSearchResults[0]?.source || "unknown",
    };
  } catch (error) {
    console.error("Error in handleQuery:", error);
    return {
      answer:
        "I'm sorry, I encountered an error processing your request. Please try again or contact PayPal support.",
      sentiment: { sentiment: "neutral", confidence: "low" },
    };
  } finally {
    dbClient.release();
  }
}

module.exports = { handleQuery };
