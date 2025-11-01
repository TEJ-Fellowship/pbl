const { detectSentiment } = require("../utils/sentiment");
const { containsProfanity } = require("../utils/textUtils");
const { formatStructuredResponse } = require("../utils/responseFormatter");
const { saveChatMessage, getChatHistory } = require("../chat/chatHistory");
const { AGENT_NAME } = require("../config/constants");
const { selectAndExecuteTools } = require("../utils/mcpToolSelector");

/**
 * Handle MCP-only queries (real-time data, no documentation search)
 * AI-based tool selection: AI decides which tools to call and with what arguments
 */
async function handleMCPOnlyQuery(
  query,
  classification,
  genAI,
  mcpTools,
  sessionId
) {
  try {
    console.log("🔧 Handling MCP-only query with AI tool selection");

    // Get chat history for context
    const chatHistory = sessionId ? await getChatHistory(sessionId, 5) : [];

    // Use AI-based tool selection
    const mcpData = await selectAndExecuteTools(
      query,
      genAI,
      mcpTools,
      classification,
      chatHistory
    );

    // Detect sentiment (for PayPal queries)
    const sentiment = await detectSentiment(query, genAI);
    const issueType =
      classification.primary_issue_type ||
      classification.issue_type?.[0] ||
      "general_help";

    // Save user message
    if (sessionId) {
      await saveChatMessage(sessionId, "user", query, { sentiment, issueType });
    }

    // Build prompt with MCP tool data
    const conversationContext =
      chatHistory.length > 0
        ? `\n\nPrevious conversation:\n${chatHistory
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join("\n")}`
        : "";

    let mcpContext = "\n\nReal-time Information from Tools:\n";
    for (const [tool, data] of Object.entries(mcpData)) {
      if (data.success && data.message) {
        mcpContext += `\n[${tool.toUpperCase()}]: ${data.message}`;
      }
    }

    let systemInstruction = `You are ${AGENT_NAME}, a helpful PayPal customer support agent. Keep your responses concise and under 150 words.`;

    if (sentiment.sentiment === "frustrated" || containsProfanity(query)) {
      systemInstruction += ` The customer may be upset. Start with one short, kind, de‑escalating sentence, then provide a clear helpful answer.`;
    } else if (sentiment.sentiment === "concerned") {
      systemInstruction += ` The customer is concerned. Be reassuring and calm.`;
    }

    // Detect if this is a policy query for better context
    const isPolicyQuery =
      /(policy.*change|policy.*update|change.*policy|update.*policy|terms.*change|terms.*update|user agreement.*change|user agreement.*update|recent.*policy|latest.*policy)/i.test(
        query
      );

    if (isPolicyQuery) {
      systemInstruction += `\n\nCRITICAL INSTRUCTIONS for policy change queries:
1. Check if search results contain ANY policy updates/changes
2. If YES (results found):
   - Start with: "YES, there are policy changes."
   - Extract and summarize the ACTUAL policy changes from the search results:
     * ALL dates mentioned - especially "Last updated on [date]" (e.g., "Last updated on 20 August 2025")
     * "X days ago", "X weeks ago" timestamps
     * Which agreements changed (e.g., "United States PayPal User Agreement", "Payment Services Agreement")
     * Effective dates if provided (e.g., "Effective September 28, 2025")
     * Key changes mentioned in snippets
   - MUST include ALL dates found in search results - they are critical information
   - Structure the response clearly with dates prominently displayed
   - Include the actual LINKS from search results
   - Format:
     "YES, there are policy changes.
     
     Last Updated: [extract date from search results, e.g., "20 August 2025"]
     
     Summary of Changes:
     [List the actual policy changes from snippets]
     
     Effective Dates:
     [List effective dates if mentioned]
     
     Links:
     [List actual URLs from search results]"
3. If NO (no results or empty):
   - Respond: "NO, no recent policy changes found."
   - Suggest checking PayPal's official policy pages

IMPORTANT: 
- Extract EVERY date mentioned in search results - dates are critical!
- Look for "Last updated on [date]" patterns - these must be included
- Extract REAL information from search result snippets/titles
- Look for phrases like "Policy Updates", "Notice of Amendment", "Last updated", "days ago"
- DO NOT make up information - use ONLY what's in the search results
- Include actual URLs from the search results
- If multiple dates are found, include ALL of them`;
    } else {
      systemInstruction += `\n\nIMPORTANT: Use the real-time tool data provided below to answer the customer's question accurately.
- The tool data is current and accurate
- Provide the information clearly and concisely
- If the tool data indicates an issue, help the customer understand next steps`;
    }

    const prompt = `${systemInstruction}${mcpContext}${conversationContext}

Customer: ${query}`;

    const responseModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
    const result = await responseModel.generateContent(prompt);
    const response = await result.response;
    let answer = response.text().trim();

    // For policy queries, allow longer responses to include all dates and details
    // For other queries, keep to 150 words
    const wordLimit = isPolicyQuery ? 250 : 150;
    const words = answer.split(" ");
    if (words.length > wordLimit) {
      answer = words.slice(0, wordLimit).join(" ") + "...";
    }

    const finalAnswer = formatStructuredResponse(
      issueType,
      false,
      answer,
      null
    );

    // Save assistant response
    if (sessionId) {
      await saveChatMessage(sessionId, "assistant", finalAnswer, {
        sentiment,
        issueType,
        searchType: "mcp_only",
      });
    }

    return {
      answer: finalAnswer,
      sentiment,
      confidence: 100,
      citations: [],
      issueType,
      disclaimer: false,
      searchType: "mcp_only",
      query_type: "mcp_only",
    };
  } catch (error) {
    console.error("Error in handleMCPOnlyQuery:", error);
    return {
      answer:
        "I'm sorry, I encountered an error processing your request. Please try again or contact PayPal support.",
      sentiment: { sentiment: "neutral", confidence: "low" },
    };
  }
}

module.exports = { handleMCPOnlyQuery };
