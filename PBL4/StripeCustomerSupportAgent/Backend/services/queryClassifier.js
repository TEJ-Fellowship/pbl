import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/config.js";

/**
 * Simple AI-Powered Query Classifier
 * Decides between MCP tools and hybrid search for optimal response
 */
class QueryClassifier {
  constructor(agentOrchestrator = null) {
    this.geminiClient = null;
    this.agentOrchestrator = agentOrchestrator;
    this.initializeGemini();
  }

  /**
   * Initialize Gemini AI client
   */
  initializeGemini() {
    try {
      if (!config.GEMINI_API_KEY_3) {
        console.warn(
          "⚠️ GEMINI_API_KEY not found. Query classifier will use fallback rules."
        );
        return;
      }

      this.geminiClient = new GoogleGenerativeAI(config.GEMINI_API_KEY_3);
      console.log("✅ Query Classifier: Gemini AI 3 initialized");
    } catch (error) {
      console.error(
        "❌ Query Classifier: Failed to initialize Gemini:",
        error.message
      );
    }
  }

  /**
   * Classify query and decide between MCP tools or hybrid search
   * @param {string} query - User query
   * @param {number} confidence - Document retrieval confidence (0-1)
   * @param {Array} enabledTools - Array of enabled tool names (optional)
   * @returns {Object} - Classification result
   */
  async classifyQuery(query, confidence = 0.5, enabledTools = null) {
    try {
      if (!this.geminiClient) {
        return this.fallbackClassification(query, confidence, enabledTools);
      }

      console.log(
        `\n🤖 Query Classifier: Analyzing "${query}" (confidence: ${confidence})`
      );

      // Get available MCP tools dynamically
      const availableTools = this.getAvailableToolsInfo(enabledTools);

      const prompt = `You are a query classifier for a Stripe support system. Analyze the user query and decide the best approach.

          User Query: "${query}"
          Document Confidence: ${confidence}

          Available MCP Tools:
          ${availableTools}

          Available approaches:
          1. MCP_TOOLS_ONLY - Use MCP tools for direct answers (calculations, status checks, etc.)
          2. HYBRID_SEARCH - Use hybrid search through documentation for comprehensive answers
          3. COMBINED - Use both MCP tools and hybrid search
          4. CONVERSATIONAL - Use only memory context/Q&A pairs (no hybrid search, no MCP tools)

          Classification Guidelines:
          - Use CONVERSATIONAL for queries asking about:
            * Personal information mentioned earlier (e.g., "what is my name?", "tell me who am i", "what did I tell you?")
            * Previously discussed topics from the conversation
            * Questions about what was said or remembered in this conversation
            * References to information shared in earlier messages
            * Requests to remember something (e.g., "remember my name is X")
            * Questions like "who am I", "what did I say", "what did you tell me"
          
          - Use MCP_TOOLS_ONLY for: calculations, status checks, real-time data, specific tool operations, and ANY non-Stripe general knowledge or current events/news queries (e.g., Israel-Palestine, Russia-Ukraine, weather today). Prefer the web_search tool in these cases.
          - Use HYBRID_SEARCH for: API documentation, implementation guides, general Stripe concepts ONLY
          - Use COMBINED for: complex queries that need both real-time data and documentation

          CRITICAL: If the query is conversational (asking about personal info, previous conversation, etc.), 
          ALWAYS use CONVERSATIONAL approach, NOT HYBRID_SEARCH or MCP_TOOLS_ONLY.

          Respond with JSON only:
          {
            "approach": "MCP_TOOLS_ONLY|HYBRID_SEARCH|COMBINED|CONVERSATIONAL",
            "reasoning": "Brief explanation",
            "confidence": 0.8,
            "isConversationQuery": true|false
          }`;

      const result = await this.geminiClient
        .getGenerativeModel({
          model: config.GEMINI_API_MODEL_3 || "gemini-2.5-flash",
        })
        .generateContent(prompt);
      const responseText = result.response.text();

      const classification = this.parseClassification(
        responseText,
        query,
        confidence
      );

      console.log(
        `✅ Query Classifier: ${classification.approach} - ${classification.reasoning}`
      );
      return classification;
    } catch (error) {
      console.error("❌ Query Classification Error:", error.message);
      return this.fallbackClassification(query, confidence, enabledTools);
    }
  }

  /**
   * Get available MCP tools information dynamically
   * @param {Array} enabledTools - Array of enabled tool names (optional)
   * @returns {string} - Formatted tools information
   */
  getAvailableToolsInfo(enabledTools = null) {
    if (!this.agentOrchestrator) {
      return "No agent orchestrator available - using fallback tool list";
    }

    try {
      const toolInfo = this.agentOrchestrator.getToolInfo();
      const availableTools = enabledTools
        ? Object.keys(toolInfo).filter((tool) => enabledTools.includes(tool))
        : Object.keys(toolInfo);

      if (availableTools.length === 0) {
        return "No MCP tools available";
      }

      return availableTools
        .map((toolName) => {
          const tool = toolInfo[toolName];
          return `• ${toolName}: ${
            tool.description || "No description available"
          }`;
        })
        .join("\n          ");
    } catch (error) {
      console.error("❌ Error getting tool info:", error.message);
      return "Error retrieving tool information";
    }
  }

  /**
   * Parse AI classification response
   * @param {string} responseText - Raw AI response
   * @param {string} query - Original query
   * @param {number} confidence - Document confidence
   * @returns {Object} - Parsed classification
   */
  parseClassification(responseText, query, confidence) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }

      const classification = JSON.parse(jsonMatch[0]);

      // Validate approach value - normalize any malformed values
      const validApproaches = [
        "MCP_TOOLS_ONLY",
        "HYBRID_SEARCH",
        "COMBINED",
        "CONVERSATIONAL",
      ];

      if (classification.approach) {
        // Normalize the approach value (handle typos, case issues, etc.)
        const normalizedApproach = classification.approach.toUpperCase().trim();

        // Check if it's a valid approach
        if (!validApproaches.includes(normalizedApproach)) {
          console.warn(
            `⚠️ Invalid approach from AI: "${classification.approach}"`
          );
          console.warn(`   Attempting to normalize...`);

          // Try to fix common issues
          if (
            normalizedApproach.includes("MCP") &&
            normalizedApproach.includes("TOOL")
          ) {
            classification.approach = "MCP_TOOLS_ONLY";
            console.log(`   ✅ Normalized to: MCP_TOOLS_ONLY`);
          } else if (
            normalizedApproach.includes("HYBRID") ||
            normalizedApproach.includes("SEARCH")
          ) {
            classification.approach = "HYBRID_SEARCH";
            console.log(`   ✅ Normalized to: HYBRID_SEARCH`);
          } else if (
            normalizedApproach.includes("COMBINED") ||
            normalizedApproach.includes("BOTH")
          ) {
            classification.approach = "COMBINED";
            console.log(`   ✅ Normalized to: COMBINED`);
          } else if (
            normalizedApproach.includes("CONVERSATIONAL") ||
            normalizedApproach.includes("MEMORY")
          ) {
            classification.approach = "CONVERSATIONAL";
            console.log(`   ✅ Normalized to: CONVERSATIONAL`);
          } else {
            // If we can't normalize, use fallback
            classification.approach = null;
          }
        } else {
          classification.approach = normalizedApproach;
        }
      }

      // Validate and set defaults if approach is still invalid
      if (
        !classification.approach ||
        !validApproaches.includes(classification.approach)
      ) {
        console.warn(`⚠️ Using fallback classification for invalid approach`);
        // Auto-detect conversational queries first
        const lowerQuery = query.toLowerCase();
        const conversationKeywords = [
          "my name",
          "name",
          "remember",
          "mentioned",
          "told",
          "said",
          "what did",
          "what was",
          "who am",
          "tell me",
          "what is my",
          "what was my",
          "you told",
          "you said",
          "earlier",
          "before",
          "previously",
          "did i",
          "did you",
          "have i",
        ];
        const isConversational = conversationKeywords.some((keyword) =>
          lowerQuery.includes(keyword)
        );

        if (isConversational) {
          classification.approach = "CONVERSATIONAL";
        } else {
          classification.approach = "HYBRID_SEARCH";
        }
      }

      if (!classification.reasoning) {
        classification.reasoning = "AI analysis completed";
      }

      if (!classification.confidence) {
        classification.confidence = confidence;
      }

      // Handle isConversationQuery field and ensure CONVERSATIONAL approach
      const lowerQuery = query.toLowerCase();
      const conversationKeywords = [
        "my name",
        "name",
        "remember",
        "mentioned",
        "told",
        "said",
        "what did",
        "what was",
        "who am",
        "tell me",
        "what is my",
        "what was my",
        "you told",
        "you said",
        "earlier",
        "before",
        "previously",
        "did i",
        "did you",
        "have i",
      ];
      const isConversational = conversationKeywords.some((keyword) =>
        lowerQuery.includes(keyword)
      );

      if (typeof classification.isConversationQuery === "undefined") {
        classification.isConversationQuery = isConversational;
      }

      // If it's a conversational query, force CONVERSATIONAL approach
      if (isConversational && classification.approach !== "CONVERSATIONAL") {
        console.log(
          `⚠️ Overriding approach to CONVERSATIONAL for conversational query`
        );
        classification.approach = "CONVERSATIONAL";
        classification.reasoning =
          "Query is conversational - using memory context only";
      }

      return classification;
    } catch (parseError) {
      console.error(
        "❌ Failed to parse classification response:",
        parseError.message
      );
      return this.fallbackClassification(query, confidence, null);
    }
  }

  /**
   * Fallback rule-based classification
   * @param {string} query - User query
   * @param {number} confidence - Document confidence
   * @param {Array} enabledTools - Array of enabled tool names (optional)
   * @returns {Object} - Fallback classification
   */
  fallbackClassification(query, confidence, enabledTools = null) {
    console.log("🔄 Using rule-based classification fallback");

    const lowerQuery = query.toLowerCase();

    // MCP tools patterns
    const mcpPatterns = [
      /\d+\.\d+%|\$\d+|\b(fee|cost|price|calculate|math)/, // Calculator
      /(down|status|working|operational|issues|not working)/, // Status checker
      /(latest|recent|new|updated|2024|2025)/, // Web search
      /(validate|check|verify|endpoint|api|code)/, // Code validator
      /(time|date|schedule|business hours|when)/, // DateTime
    ];

    // Hybrid search patterns
    const hybridPatterns = [
      /(how to|implement|setup|configure|integrate)/,
      /(api|endpoint|webhook|payment|billing)/,
      /(documentation|guide|tutorial|example)/,
      /(error|problem|issue|troubleshoot)/,
    ];

    // Conversation query patterns
    const conversationPatterns = [
      /(my name|name|remember|mentioned|told|said)/,
      /(what did|what was|who am|tell me|what is my|what was my)/,
      /(you told|you said|earlier|before|previously)/,
      /(did i|did you|have i)/,
    ];

    const hasMCPPattern = mcpPatterns.some((pattern) =>
      pattern.test(lowerQuery)
    );
    const hasHybridPattern = hybridPatterns.some((pattern) =>
      pattern.test(lowerQuery)
    );
    const isConversationQuery = conversationPatterns.some((pattern) =>
      pattern.test(lowerQuery)
    );

    let approach = "HYBRID_SEARCH"; // Default
    let reasoning = "Default to hybrid search";

    // Check conversational queries FIRST (highest priority)
    if (isConversationQuery) {
      approach = "CONVERSATIONAL";
      reasoning = "Conversational query - using memory context only";
    } else if (hasMCPPattern && !hasHybridPattern) {
      approach = "MCP_TOOLS_ONLY";
      reasoning = "Query matches MCP tool patterns";
    } else if (hasMCPPattern && hasHybridPattern) {
      approach = "COMBINED";
      reasoning = "Query needs both MCP tools and documentation";
    } else if (confidence < 0.6) {
      approach = "COMBINED";
      reasoning = "Low confidence - use both approaches";
    }

    return {
      approach,
      reasoning,
      confidence,
      isConversationQuery,
    };
  }

  /**
   * Get classification statistics
   * @returns {Object} - Classification stats
   */
  getStats() {
    return {
      geminiAvailable: !!this.geminiClient,
      model: this.geminiClient ? "gemini-2.5-flash" : "fallback",
      approaches: [
        "MCP_TOOLS_ONLY",
        "HYBRID_SEARCH",
        "COMBINED",
        "CONVERSATIONAL",
      ],
    };
  }
}

export default QueryClassifier;
