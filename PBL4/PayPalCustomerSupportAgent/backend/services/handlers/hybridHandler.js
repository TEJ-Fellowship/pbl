const { detectSentiment } = require("../utils/sentiment");
const { containsProfanity, isPolicyLikeSource } = require("../utils/textUtils");
const { formatStructuredResponse } = require("../utils/responseFormatter");
const { saveChatMessage, getChatHistory } = require("../chat/chatHistory");
const { logConversation } = require("../../dbHybrid");
const { hybridSearch } = require("../search/hybridSearch");
const { combineHybridAndWebResults } = require("../search/resultCombiner");
const { AGENT_NAME } = require("../config/constants");
const { selectAndExecuteTools } = require("../utils/mcpToolSelector");
const { enhanceQueryForSearch } = require("../utils/queryEnhancer");

/**
 * Handle hybrid queries (both MCP tools and documentation search)
 * AI-based tool selection: AI decides which tools to call and with what arguments
 */
async function handleHybridQuery(
  query,
  classification,
  genAI,
  mcpTools,
  embedder,
  index,
  dbClient,
  sessionId
) {
  try {
    console.log(
      "🔄 Handling hybrid query (MCP tools + documentation) with AI tool selection"
    );

    // Get chat history for context (previous messages from this sessionId)
    const chatHistory = sessionId ? await getChatHistory(sessionId, 10) : [];

    // Use AI-based tool selection
    const mcpData = await selectAndExecuteTools(
      query,
      genAI,
      mcpTools,
      classification,
      chatHistory
    );

    // AI-powered query enhancement for documentation search (happens AFTER classification)
    const enhancedQuery = await enhanceQueryForSearch(
      query,
      classification,
      genAI
    );
    console.log(`🔍 Original query: "${query}"`);
    if (enhancedQuery !== query) {
      console.log(
        `✨ Enhanced query for documentation search: "${enhancedQuery}"`
      );
    }

    // Run hybrid search with enhanced query (MCP tools use original query)
    const hybridResults = await hybridSearch(
      enhancedQuery,
      embedder,
      index,
      dbClient
    );

    // Combine web search results if available
    let finalSearchResults = hybridResults;
    // Check for web search results (could be from AI-selected "search_web" tool or fallback "websearch")
    const webData =
      mcpData.search_web || mcpData.web_search || mcpData.websearch;
    if (webData && webData.success && webData.data) {
      const webResults = webData.data;
      finalSearchResults = combineHybridAndWebResults(
        hybridResults,
        webResults
      );
    }

    if (finalSearchResults.length === 0) {
      return {
        answer: "No relevant info found. Please contact PayPal support.",
        sentiment: { sentiment: "neutral", confidence: "low" },
      };
    }

    // Detect sentiment and issue type
    const sentiment = await detectSentiment(query, genAI);
    const issueType =
      classification.primary_issue_type ||
      classification.issue_type?.[0] ||
      "general_help";

    // Save user message
    if (sessionId) {
      await saveChatMessage(sessionId, "user", query, { sentiment, issueType });
    }

    // Prepare context
    const context = finalSearchResults
      .map((chunk, idx) => {
        const content =
          chunk.metadata?.text ||
          chunk.metadata?.preview ||
          chunk.snippet ||
          chunk.title ||
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

    const conversationContext =
      chatHistory.length > 0
        ? `\n\nPrevious conversation:\n${chatHistory
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join("\n")}`
        : "";

    const lowerQ = String(query || "").toLowerCase();
    const shouldIntroduce =
      /what\s+is\s+your\s+name|who\s+are\s+you|hello|hi|hey/.test(lowerQ);
    const sawProfanity = containsProfanity(query);

    let systemInstruction = `You are ${AGENT_NAME}, a helpful PayPal customer support agent. Keep your responses concise and under 150 words.

IMPORTANT: Use information from the "Previous conversation" section below to remember details the user shared in this conversation. If the user asks personal questions, check the conversation history first and answer naturally using that information. Do NOT say things like "I've noted that", "For future reference", or "You told me earlier" - just answer naturally using what they shared previously.`;

    if (shouldIntroduce) {
      systemInstruction += ` If the user asked or greeted, briefly introduce yourself as ${AGENT_NAME}.`;
    } else {
      systemInstruction += ` Do not introduce yourself unless explicitly asked or greeted.`;
    }

    if (sentiment.sentiment === "frustrated" || sawProfanity) {
      systemInstruction += ` The customer may be upset. Start with one short, kind, de‑escalating sentence, then provide a clear helpful answer.`;
    } else if (sentiment.sentiment === "concerned") {
      systemInstruction += ` The customer is concerned. Be reassuring and calm.`;
    }

    systemInstruction += `\n\nIMPORTANT: You have access to both real-time tool data and documentation:
- PRIORITIZE real-time tool data for current status, currency conversions, and live information
- Use documentation for general policies, procedures, and detailed explanations
- Combine tool data with documentation to provide comprehensive answers
- Always mention when you're using real-time data vs documentation`;

    const prompt = `${systemInstruction}

Context from PayPal documentation:
${context}${mcpContext}${conversationContext}

Customer: ${query}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let answer = response.text().trim();

    // Ensure response is under 150 words
    const words = answer.split(" ");
    if (words.length > 150) {
      answer = words.slice(0, 150).join(" ") + "...";
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
      answer,
      disclaimerText
    );

    // Save assistant response
    if (sessionId) {
      await saveChatMessage(sessionId, "assistant", finalAnswer, {
        sentiment,
        issueType,
        confidence: finalSearchResults[0]?.combinedScore || 0,
        searchType: "hybrid",
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
      searchType: "hybrid",
      query_type: "hybrid",
    };
  } catch (error) {
    console.error("Error in handleHybridQuery:", error);
    return {
      answer:
        "I'm sorry, I encountered an error processing your request. Please try again or contact PayPal support.",
      sentiment: { sentiment: "neutral", confidence: "low" },
    };
  }
}

module.exports = { handleHybridQuery };
