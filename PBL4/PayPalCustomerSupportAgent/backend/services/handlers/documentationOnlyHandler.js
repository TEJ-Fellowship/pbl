const { detectSentiment } = require("../utils/sentiment");
const { containsProfanity, isPolicyLikeSource } = require("../utils/textUtils");
const { formatStructuredResponse } = require("../utils/responseFormatter");
const { saveChatMessage, getChatHistory } = require("../chat/chatHistory");
const { logConversation } = require("../../dbHybrid");
const { hybridSearch } = require("../search/hybridSearch");
const { AGENT_NAME } = require("../config/constants");

/**
 * Handle documentation-only queries (hybrid search, no MCP tools)
 */
async function handleDocumentationOnlyQuery(
  query,
  classification,
  genAI,
  embedder,
  index,
  dbClient,
  sessionId
) {
  try {
    console.log("📚 Handling documentation-only query");

    // Run hybrid search only
    const hybridResults = await hybridSearch(query, embedder, index, dbClient);

    if (hybridResults.length === 0) {
      return {
        answer:
          "No relevant information found in our documentation. Please contact PayPal support for assistance.",
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

    // Build prompt with documentation context only
    const chatHistory = sessionId ? await getChatHistory(sessionId, 5) : [];
    const conversationContext =
      chatHistory.length > 0
        ? `\n\nPrevious conversation:\n${chatHistory
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join("\n")}`
        : "";

    const context = hybridResults
      .map((chunk, idx) => {
        const content =
          chunk.metadata?.text ||
          chunk.metadata?.preview ||
          "No content available";
        return `[Source ${idx + 1}]: ${content}`;
      })
      .join("\n\n");

    const lowerQ = String(query || "").toLowerCase();
    const shouldIntroduce =
      /what\s+is\s+your\s+name|who\s+are\s+you|hello|hi|hey/.test(lowerQ);
    const sawProfanity = containsProfanity(query);

    let systemInstruction = `You are ${AGENT_NAME}, a helpful PayPal customer support agent. Keep your responses concise and under 150 words.`;

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

    systemInstruction += `\n\nIMPORTANT: You have access to PayPal documentation. Use this information to provide accurate, detailed answers.
- Base your answer on the documentation provided
- For current status or recent changes, suggest checking PayPal's official status page
- Mention that this information is from official documentation`;

    const prompt = `${systemInstruction}

Context from PayPal documentation:
${context}${conversationContext}

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
      (hybridResults[0]?.combinedScore || 0) < 0.5 ||
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
        confidence: hybridResults[0]?.combinedScore || 0,
        searchType: "documentation_only",
      });
    }

    // Log conversation
    logConversation({
      sessionId: sessionId || null,
      query,
      issueType,
      sentiment,
      topCitations: hybridResults.map((c) => ({
        source: c.metadata?.source || "Unknown",
        channel: "hybrid",
        isPolicy: isPolicyLikeSource(c.metadata?.source),
        score: c.combinedScore,
      })),
    });

    return {
      answer: finalAnswer,
      sentiment,
      confidence: Math.min(
        100,
        Math.max(0, Math.round((hybridResults[0]?.combinedScore || 0) * 100))
      ),
      citations: hybridResults.map((c, idx) => ({
        label: `Source ${idx + 1}`,
        source: c.metadata?.source || "docs",
        isPolicy: isPolicyLikeSource(c.metadata?.source),
        channel: "hybrid",
        isOfficial: c.isOfficial || false,
        isRecent: c.isRecent || false,
        priority: c.priority || "unknown",
      })),
      issueType,
      disclaimer: includeDisclaimer,
      searchType: "documentation_only",
      query_type: "documentation_only",
    };
  } catch (error) {
    console.error("Error in handleDocumentationOnlyQuery:", error);
    return {
      answer:
        "I'm sorry, I encountered an error processing your request. Please try again or contact PayPal support.",
      sentiment: { sentiment: "neutral", confidence: "low" },
    };
  }
}

module.exports = { handleDocumentationOnlyQuery };
