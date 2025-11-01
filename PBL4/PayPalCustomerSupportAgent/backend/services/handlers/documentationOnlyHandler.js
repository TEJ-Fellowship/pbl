const { detectSentiment } = require("../utils/sentiment");
const { containsProfanity, isPolicyLikeSource } = require("../utils/textUtils");
const { formatStructuredResponse } = require("../utils/responseFormatter");
const { saveChatMessage, getChatHistory } = require("../chat/chatHistory");
const { logConversation } = require("../../dbHybrid");
const { hybridSearch } = require("../search/hybridSearch");
const { AGENT_NAME } = require("../config/constants");
const { enhanceQueryForSearch } = require("../utils/queryEnhancer");

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

    // AI-powered query enhancement (happens AFTER classification)
    const enhancedQuery = await enhanceQueryForSearch(
      query,
      classification,
      genAI
    );
    console.log(`🔍 Original query: "${query}"`);
    if (enhancedQuery !== query) {
      console.log(`✨ Enhanced query: "${enhancedQuery}"`);
    }

    // Run hybrid search with enhanced query
    const hybridResults = await hybridSearch(
      enhancedQuery,
      embedder,
      index,
      dbClient
    );

    if (hybridResults.length === 0) {
      return {
        answer:
          "No relevant information found in our documentation. Please contact PayPal support for assistance.",
        sentiment: { sentiment: "neutral", confidence: "low" },
      };
    }

    // Get chat history for context (BEFORE saving current message)
    const chatHistory = sessionId ? await getChatHistory(sessionId, 10) : [];

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

    // Build prompt with documentation context
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
        const sourceFile = chunk.metadata?.source || "unknown";
        // Highlight Braintree sources for better AI recognition
        const sourceLabel = sourceFile.includes("braintree")
          ? `[BRAINTREE SOURCE: ${sourceFile}]`
          : `[Source: ${sourceFile}]`;
        return `${sourceLabel}\n${content}`;
      })
      .join("\n\n");

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

    systemInstruction += `\n\nIMPORTANT: You have access to PayPal documentation. Use this information to provide accurate, detailed answers.
- Base your answer on the documentation provided
- Extract ACTUAL data, percentages, rates, and amounts from tables and documentation
- For current status or recent changes, suggest checking PayPal's official status page
- Mention that this information is from official documentation`;

    // Detect if this is a fee query or "all fees" query for specific instructions
    const isFeeQuery = /fee|fees|charge|charges|pricing|cost|rate/.test(lowerQ);
    const isAllFeesQuery =
      /all.*fee|fee.*table|fee.*structure|every.*fee|complete.*fee|all.*fee.*table/.test(
        lowerQ
      );

    // Detect query keywords for context-aware prompts (used later)
    const mentionsBraintree = /braintree/i.test(query);
    const mentionsVenmo = /venmo/i.test(query);
    const mentionsCards = /card|credit|debit/i.test(query);
    const mentionsACH = /ach/i.test(query);

    // Add fee-specific instructions when dealing with fee queries
    if (isFeeQuery) {
      systemInstruction += `\n\nFEE QUERY INSTRUCTIONS:
- Look through ALL documentation chunks below
- Find rows that match what the user is asking about (e.g., if asking about "cards", find rows mentioning "Cards" or "card")
- Extract the fee/rate value from that row. Fee data might be in fields like "Fee", "Rate", "Rate per transaction", etc.
- Different tables have different headers: "Payment type", "Payment method", "Currency", "Transfer Type", "Purchase, sale, or conversion amount", etc.
- Match the user's question to ANY relevant field in the row data
- State the fee directly from the row - do not say "not specified" if you see fee data in the chunks`;

      if (mentionsVenmo) {
        systemInstruction += `\n\nVENMO QUERY: In the chunks below, find rows mentioning "Venmo" (could be "Payment type: Venmo transactions" or "Visa+ transaction to Venmo") and extract the fee value from that row.`;
      }

      // Detect if this might be a consumer fee query (crypto, currency conversion, sending money, etc.)
      const isConsumerFeeQuery =
        /crypto|currency|conversion|withdrawal|sending.*money|bank.*account|transfer|donation|donate/i.test(
          query
        );

      // Detect cryptocurrency-specific queries
      const isCryptoQuery =
        /crypto|cryptocurrency|bitcoin|ethereum|blockchain|btc|eth|digital.*currency/i.test(
          query
        );

      // Robust amount detection - handles various formats:
      // $150, 150 USD, 150 dollars, 150.50, USD 150, etc.
      const amountPatterns = [
        /\$(\d+(?:\.\d+)?)/, // $150, $150.50
        /(\d+(?:\.\d+)?)\s*(?:USD|usd|dollar|dollars)/i, // 150 USD, 150 dollars
        /USD\s*(\d+(?:\.\d+)?)/i, // USD 150
        /(\d+(?:\.\d+)?)\s*(?:for|worth|of)/i, // 150 for, 150 worth
      ];

      let specifiedAmount = null;
      let currency = "USD"; // Default currency

      for (const pattern of amountPatterns) {
        const match = query.match(pattern);
        if (match) {
          specifiedAmount = parseFloat(
            match[1] || match[0].replace(/[^0-9.]/g, "")
          );
          // Check for currency in the query
          if (/EUR|euro/i.test(query)) currency = "EUR";
          else if (/GBP|pound|sterling/i.test(query)) currency = "GBP";
          else if (/JPY|yen/i.test(query)) currency = "JPY";
          else if (/CAD|canadian/i.test(query)) currency = "CAD";
          break;
        }
      }

      // Fallback: any number in the query
      if (!specifiedAmount) {
        const simpleMatch = query.match(/(\d+(?:\.\d+)?)/);
        if (
          simpleMatch &&
          parseFloat(simpleMatch[1]) > 0 &&
          parseFloat(simpleMatch[1]) < 1000000
        ) {
          specifiedAmount = parseFloat(simpleMatch[1]);
        }
      }

      const hasAmount = specifiedAmount !== null && specifiedAmount > 0;

      if (isConsumerFeeQuery) {
        systemInstruction += `\n\nCONSUMER FEE QUERY: Consumer fees may have headers like "Payment method", "Currency", "Transfer Type", "Purchase, sale, or conversion amount". Look for the relevant header and extract the "Fee" value from matching rows.`;
      }

      // General fee calculation instruction for ANY fee query with an amount
      if (hasAmount) {
        systemInstruction += `\n\nFEE CALCULATION REQUEST (CRITICAL):
The user wants to know the fee for ${specifiedAmount} ${currency}. You MUST provide a calculated answer.

STEP-BY-STEP PROCESS:
1. SEARCH: Look through ALL documentation chunks below for fee information related to what the user asked about
2. MATCH: Find the relevant table/row that matches:
   - The transaction type mentioned (cryptocurrency, money transfer, currency conversion, etc.)
   - The amount range (if tiered rates exist)
3. EXTRACT: Get the fee structure from the matching row:
   - Percentage rates (e.g., "2.20%", "2.00%")
   - Fixed fees (e.g., "0.29 USD", "0.49 USD")
   - Combined fees (e.g., "2.89% + 0.29 USD")
   - Tiered structures with amount ranges
4. CALCULATE: Compute the actual fee:
   - Percentage only: ${specifiedAmount} × (rate/100)
   - Fixed only: Use the fixed amount
   - Combined: (${specifiedAmount} × percentage/100) + fixed_amount
   - Tiered: Find the correct tier for ${specifiedAmount}, then calculate
5. PRESENT: Format your answer clearly:
   - State the fee rate/structure found
   - Show the calculation
   - Give the final fee amount
   - Be concise but complete

IMPORTANT:
- If the user asks "what is the fee for X", they want BOTH the rate AND the calculated amount
- NEVER say "I cannot calculate" if you have the rate - ALWAYS calculate it
- Round to 2 decimal places for currency amounts
- Use natural language but be precise

Examples:
- Query: "fee for $150 crypto" → Find crypto fee tier, calculate: $150 × 2.00% = $3.00
- Query: "fee for $100 transfer" → Find transfer fee structure, calculate accordingly`;

        if (isCryptoQuery) {
          systemInstruction += `\n\nCRYPTOCURRENCY SPECIFIC: Look for tables with header "Purchase, sale, or conversion amount". Match ${specifiedAmount} to the correct tier (e.g., "75.00 – 200.00 USD" contains ${specifiedAmount}).`;
        }
      } else if (isCryptoQuery) {
        systemInstruction += `\n\nCRYPTOCURRENCY FEE QUERY:
- Look for tables with headers like "Purchase, sale, or conversion amount" and "Fee"
- These tables show tiered fee rates based on transaction amount ranges
- Present the fee structure clearly, showing the percentage rates for different amount ranges`;
      }

      if (isAllFeesQuery) {
        systemInstruction += `\n- The user is asking for ALL fee information - extract and present ALL fee-related tables, rates, and structures from the documentation
- Include domestic fees, international fees, payment method fees, account type fees, currency conversion fees - everything relevant`;
      }
    }

    const prompt = `${systemInstruction}

Documentation chunks:
${context}${conversationContext}

Customer: ${query}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let answer = response.text().trim();

    // Ensure response is under 150 words (but allow more for comprehensive fee tables)
    const maxWords = isAllFeesQuery ? 300 : 150;
    const words = answer.split(" ");
    if (words.length > maxWords) {
      answer = words.slice(0, maxWords).join(" ") + "...";
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
