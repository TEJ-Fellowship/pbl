const { GoogleGenerativeAI } = require("@google/generative-ai");

class QueryRouter {
  constructor(genAI) {
    this.genAI = genAI;
    this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  /**
   * Main classification method - uses AI to classify query
   * @param {string} query - User query
   * @param {object} context - Optional context (session history, etc.)
   * @returns {Promise<ClassificationResult>}
   */
  async classify(query, context = {}) {
    try {
      const prompt = this.buildClassificationPrompt(query, context);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const rawResponse = response.text().trim();

      // Parse AI response
      const parsed = this.parseClassificationResponse(rawResponse);

      if (parsed && this.validateClassification(parsed)) {
        return this.enrichClassification(parsed, query);
      } else {
        console.log("⚠️ AI classification failed validation, using fallback");
        return this.ruleBasedFallback(query);
      }
    } catch (error) {
      console.error("❌ Query classification failed:", error.message);
      return this.ruleBasedFallback(query);
    }
  }

  /**
   * Build the classification prompt for Gemini
   */
  buildClassificationPrompt(query, context) {
    return [
      "You are a query classifier for PayPal customer support agent.",
      "Classify the user's query into the following categories:",
      "",
      "QUERY_TYPE (single choice - determines search strategy):",
      "- general: Questions NOT related to PayPal (e.g., 'what is AI', 'weather today', general knowledge)",
      "- mcp_only: Real-time data queries that ONLY need MCP tools (currency conversion, PayPal status, fee calculation)",
      "- documentation_only: Policy/procedure questions that ONLY need documentation search (how-to guides, dispute process, refund policies)",
      "- hybrid: Complex queries needing BOTH MCP tools AND documentation (e.g., 'recent outage + refund policy')",
      "",
      "ISSUE_TYPE (can be multiple, or null if general query):",
      "- greeting: Greetings (hello, hi)",
      "- identity: Questions about the assistant",
      "- dispute: Chargebacks, disputes, case resolutions",
      "- refund: Refund requests and returns",
      "- fees: Fee questions, pricing, charges",
      "- payment_issue: Payment problems, transfers, payouts",
      "- account_limitation: Account restrictions, holds, frozen accounts",
      "- currency_conversion: Currency exchange questions",
      "- transaction_status: Transaction status inquiries",
      "- service_status: PayPal service status, outages",
      "- security: Security concerns, account security",
      "- general_help: General PayPal support questions",
      "",
      "REQUIRES_MCP_TOOLS (array, can be empty):",
      "- currency: Currency conversion queries",
      "- status_check: PayPal service status/outage queries",
      "- fee_calculation: Fee calculation queries",
      "- web_search: Recent information needed (ALWAYS use for policy changes, updates, recent changes)",
      "- timeline: Transaction timeline estimates",
      "",
      "IMPORTANT: Policy change queries should use web_search tool and be classified as hybrid or mcp_only.",
      "Policy queries include: policy changes, terms updates, user agreement changes, etc.",
      "These need real-time web search to find the latest policy updates.",
      "",
      "Return ONLY valid JSON with this exact structure:",
      "{",
      '  "query_type": "general" | "mcp_only" | "documentation_only" | "hybrid",',
      '  "issue_type": ["dispute"] or ["refund", "fees"] or null,',
      '  "requires_mcp_tools": ["currency"] or ["status_check", "web_search"] or [],',
      '  "is_paypal_related": true | false,',
      '  "confidence": "high" | "medium" | "low"',
      "}",
      "",
      "Examples:",
      'Query: "What is artificial intelligence?"',
      '→ {"query_type": "general", "issue_type": null, "requires_mcp_tools": [], "is_paypal_related": false, "confidence": "high"}',
      "",
      'Query: "Convert 100 USD to EUR"',
      '→ {"query_type": "mcp_only", "issue_type": ["currency_conversion"], "requires_mcp_tools": ["currency"], "is_paypal_related": true, "confidence": "high"}',
      "",
      'Query: "what is 100 dollar in nrs"',
      '→ {"query_type": "mcp_only", "issue_type": ["currency_conversion"], "requires_mcp_tools": ["currency"], "is_paypal_related": true, "confidence": "high"}',
      "",
      'Query: "How do I request a refund?"',
      '→ {"query_type": "documentation_only", "issue_type": ["refund"], "requires_mcp_tools": [], "is_paypal_related": true, "confidence": "high"}',
      "",
      'Query: "What are the recent policy changes?"',
      '→ {"query_type": "hybrid", "issue_type": ["general_help"], "requires_mcp_tools": ["web_search"], "is_paypal_related": true, "confidence": "high"}',
      "",
      'Query: "Is PayPal down today and what is the refund policy?"',
      '→ {"query_type": "hybrid", "issue_type": ["service_status", "refund"], "requires_mcp_tools": ["status_check"], "is_paypal_related": true, "confidence": "high"}',
      "",
      `Query: "${query}"`,
      context.sessionHistory
        ? `\nRecent context: ${JSON.stringify(context.sessionHistory)}`
        : "",
    ].join("\n");
  }

  /**
   * Parse and extract JSON from AI response
   */
  parseClassificationResponse(rawResponse) {
    try {
      let jsonText = rawResponse.trim();

      // Handle markdown-wrapped JSON
      if (jsonText.includes("```json")) {
        jsonText = jsonText.split("```json")[1].split("```")[0].trim();
      } else if (jsonText.includes("```")) {
        jsonText = jsonText.split("```")[1].split("```")[0].trim();
      }

      // Remove any leading/trailing whitespace or newlines
      jsonText = jsonText.trim();

      // Try to extract JSON if wrapped in other text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonText);
      return parsed;
    } catch (error) {
      console.error("Failed to parse classification response:", error.message);
      console.log("Raw response:", rawResponse);
      return null;
    }
  }

  /**
   * Validate classification structure
   */
  validateClassification(result) {
    if (!result) return false;

    const validQueryTypes = [
      "general",
      "mcp_only",
      "documentation_only",
      "hybrid",
    ];
    const validConfidence = ["high", "medium", "low"];

    return (
      result.query_type &&
      validQueryTypes.includes(result.query_type) &&
      typeof result.is_paypal_related === "boolean" &&
      Array.isArray(result.requires_mcp_tools) &&
      validConfidence.includes(result.confidence) &&
      (result.issue_type === null || Array.isArray(result.issue_type))
    );
  }

  /**
   * Rule-based fallback when AI fails
   */
  ruleBasedFallback(query) {
    const lowerQuery = query.toLowerCase();

    // Check if PayPal-related
    const paypalKeywords = [
      "paypal",
      "payment",
      "transaction",
      "refund",
      "dispute",
      "fee",
      "charge",
      "transfer",
      "account",
      "hold",
      "payout",
      "chargeback",
      "currency",
      "exchange rate",
    ];

    const isPayPalRelated = paypalKeywords.some((keyword) =>
      lowerQuery.includes(keyword)
    );

    // If not PayPal-related, it's general
    if (!isPayPalRelated) {
      return {
        query_type: "general",
        issue_type: null,
        requires_mcp_tools: [],
        is_paypal_related: false,
        confidence: "medium",
        source: "rule_based",
      };
    }

    // Determine query_type
    let queryType = "documentation_only";
    const requiresMCPTools = [];

    // Check for MCP tool requirements
    // Include common currency terms: dollar, rupee, nrs, npr, etc.
    if (
      /convert|exchange|currency|rate|USD|EUR|GBP|JPY|DOLLAR|RUPEE|NRS|NPR|NEPALI/i.test(
        lowerQuery
      )
    ) {
      requiresMCPTools.push("currency");
      queryType = "mcp_only";
    }

    if (
      /down|outage|status|working|broken|not working|maintenance/.test(
        lowerQuery
      )
    ) {
      requiresMCPTools.push("status_check");
      if (queryType === "mcp_only") {
        queryType = "hybrid"; // If multiple tools, might need docs too
      } else {
        queryType = "mcp_only";
      }
    }

    if (
      /fee|calculate|how much|cost|pricing/.test(lowerQuery) &&
      /for \$|transaction/.test(lowerQuery)
    ) {
      requiresMCPTools.push("fee_calculation");
      if (queryType === "mcp_only") {
        queryType = "hybrid";
      } else {
        queryType = "mcp_only";
      }
    }

    // Trigger web_search for policy change queries and recent updates
    if (
      /(policy.*change|policy.*update|change.*policy|update.*policy|terms.*change|terms.*update|user agreement.*change|user agreement.*update|recent.*policy|latest.*policy)/i.test(
        lowerQuery
      )
    ) {
      requiresMCPTools.push("web_search");
      if (queryType !== "general") {
        queryType = queryType === "mcp_only" ? "hybrid" : "hybrid";
      }
    }

    // Trigger web_search for recent/current/today/now queries (but not for general policy questions)
    if (
      /(recent|current|today|now|latest|update|change)/i.test(lowerQuery) &&
      !/(what.*policy|explain.*policy|how.*policy|tell.*policy)/i.test(
        lowerQuery
      )
    ) {
      requiresMCPTools.push("web_search");
      if (queryType !== "general") {
        queryType = queryType === "mcp_only" ? "hybrid" : "hybrid";
      }
    }

    // Only trigger timeline for explicit transaction timeline queries
    if (
      /(timeline|hold period|funds available|when will.*funds|money available)/i.test(
        lowerQuery
      )
    ) {
      requiresMCPTools.push("timeline");
      if (queryType !== "general") {
        queryType = queryType === "mcp_only" ? "hybrid" : "documentation_only";
      }
    }

    // Determine issue_type
    const issueTypes = [];
    if (/greeting|hello|hi|hey/.test(lowerQuery)) {
      issueTypes.push("greeting");
    }
    if (/who are you|what are you|your name/.test(lowerQuery)) {
      issueTypes.push("identity");
    }
    if (/dispute|chargeback|case|resolution/.test(lowerQuery)) {
      issueTypes.push("dispute");
    }
    if (/refund|refunds|return/.test(lowerQuery)) {
      issueTypes.push("refund");
    }
    if (/fee|fees|charge|rate|pricing/.test(lowerQuery)) {
      issueTypes.push("fees");
    }
    if (/payment|transfer|send|receive|payout/.test(lowerQuery)) {
      issueTypes.push("payment_issue");
    }
    if (/limit|limitation|restricted|hold|frozen/.test(lowerQuery)) {
      issueTypes.push("account_limitation");
    }
    if (issueTypes.length === 0 && isPayPalRelated) {
      issueTypes.push("general_help");
    }

    return {
      query_type: queryType,
      issue_type: issueTypes.length > 0 ? issueTypes : null,
      requires_mcp_tools: requiresMCPTools,
      is_paypal_related: isPayPalRelated,
      confidence: "medium",
      source: "rule_based",
    };
  }

  /**
   * Enrich classification with metadata
   */
  enrichClassification(classification, query) {
    return {
      ...classification,
      query: query,
      timestamp: new Date().toISOString(),
      source: "ai_model",
      // Add primary issue type (first one if multiple)
      primary_issue_type:
        classification.issue_type && classification.issue_type.length > 0
          ? classification.issue_type[0]
          : null,
    };
  }
}

module.exports = QueryRouter;
