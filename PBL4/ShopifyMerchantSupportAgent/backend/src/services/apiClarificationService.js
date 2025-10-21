import { GoogleGenerativeAI } from "@google/generative-ai";

class ApiClarificationService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initializeAI();
  }

  async initializeAI() {
    if (this.model) return; // Already initialized

    try {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      });
      console.log("✅ API Clarification Service initialized");
    } catch (error) {
      console.error(
        "❌ Failed to initialize API Clarification Service:",
        error
      );
      throw error;
    }
  }

  /**
   * Detect if a query needs API clarification
   * @param {string} query - User query
   * @param {Array} conversationHistory - Previous conversation messages
   * @returns {Object} - Clarification result
   */
  async detectApiClarification(query, conversationHistory = []) {
    try {
      await this.initializeAI();

      // Check if this is a clarifying response (user answering our question)
      const isClarifyingResponse = await this.isClarifyingResponse(
        query,
        conversationHistory
      );
      if (isClarifyingResponse) {
        return {
          needsClarification: false,
          isClarifyingResponse: true,
          detectedApi: this.extractApiFromResponse(query),
        };
      }

      // Check if query is ambiguous and needs clarification
      const clarificationNeeded = await this.needsClarification(
        query,
        conversationHistory
      );

      if (clarificationNeeded.needsClarification) {
        return {
          needsClarification: true,
          isClarifyingResponse: false,
          clarificationQuestion: clarificationNeeded.question,
          suggestedApis: clarificationNeeded.suggestedApis,
          confidence: clarificationNeeded.confidence,
        };
      }

      return {
        needsClarification: false,
        isClarifyingResponse: false,
        detectedApi: clarificationNeeded.detectedApi,
      };
    } catch (error) {
      console.error("❌ Error in API clarification detection:", error);
      // Fallback: don't ask for clarification
      return {
        needsClarification: false,
        isClarifyingResponse: false,
        detectedApi: null,
        error: error.message,
      };
    }
  }

  /**
   * Check if the current query is a clarifying response
   */
  async isClarifyingResponse(query, conversationHistory) {
    if (conversationHistory.length === 0) return false;

    const lastMessage = conversationHistory[conversationHistory.length - 1];
    if (lastMessage.role !== "assistant") return false;

    // Check if last message was a clarification question
    const clarificationPatterns = [
      "which API",
      "which endpoint",
      "which service",
      "REST API or GraphQL",
      "Admin API or Storefront API",
      "please specify",
      "could you clarify",
    ];

    const isClarificationQuestion = clarificationPatterns.some((pattern) =>
      lastMessage.content.toLowerCase().includes(pattern)
    );

    return isClarificationQuestion;
  }

  /**
   * Extract API from user's clarifying response
   */
  extractApiFromResponse(response) {
    const apiKeywords = {
      rest: "REST Admin API",
      graphql: "GraphQL Admin API",
      storefront: "Storefront API",
      admin: "Admin API",
      webhook: "Webhooks",
      app: "App Development",
      theme: "Theme Development",
      liquid: "Liquid",
      checkout: "Checkout API",
      payment: "Payment API",
    };

    const lowerResponse = response.toLowerCase();

    for (const [keyword, api] of Object.entries(apiKeywords)) {
      if (lowerResponse.includes(keyword)) {
        return api;
      }
    }

    return "General Shopify";
  }

  /**
   * Determine if query needs clarification
   */
  async needsClarification(query, conversationHistory) {
    try {
      const prompt = `You are a Shopify API expert. Analyze the user query and determine if it needs clarification about which specific API to use.

USER QUERY: "${query}"

CONVERSATION HISTORY:
${conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}

AVAILABLE SHOPIFY APIs:
- REST Admin API (products, orders, customers, inventory)
- GraphQL Admin API (flexible data querying)
- Storefront API (customer-facing store data)
- Webhooks (real-time notifications)
- App Development (custom apps)
- Theme Development (storefront customization)
- Liquid (template language)
- Checkout API (payment processing)

ANALYSIS RULES:
1. If the query is very specific (mentions exact API names, endpoints, or clear context), return "NO_CLARIFICATION"
2. If the query is ambiguous and could apply to multiple APIs, return "NEEDS_CLARIFICATION"
3. Consider the conversation context - if previous messages provide context, clarification may not be needed

RESPONSE FORMAT (JSON):
{
  "needsClarification": boolean,
  "confidence": number (0-1),
  "reasoning": "explanation",
  "detectedApi": "specific API name or null",
  "suggestedApis": ["list of relevant APIs"],
  "question": "clarifying question to ask user"
}

Examples:
- "How do I create a product?" → NEEDS_CLARIFICATION (could be REST or GraphQL)
- "How do I create a product using REST API?" → NO_CLARIFICATION (specific)
- "What's the GraphQL query for products?" → NO_CLARIFICATION (specific)
- "How do I get customer data?" → NEEDS_CLARIFICATION (could be Admin or Storefront API)

Respond with valid JSON only:`;

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const response = result.response?.text() || "{}";
      const analysis = JSON.parse(response);

      // Generate clarifying question if needed
      if (analysis.needsClarification) {
        analysis.question = this.generateClarifyingQuestion(
          analysis.suggestedApis,
          query
        );
      }

      return analysis;
    } catch (error) {
      console.error("❌ Error in clarification analysis:", error);
      return {
        needsClarification: false,
        confidence: 0,
        reasoning: "Error in analysis",
        detectedApi: null,
        suggestedApis: [],
        question: "",
      };
    }
  }

  /**
   * Generate a clarifying question for the user
   */
  generateClarifyingQuestion(suggestedApis, originalQuery) {
    if (suggestedApis.length === 0) {
      return "Could you please specify which Shopify API you'd like to use for this query?";
    }

    if (suggestedApis.length === 2) {
      return `I can help you with "${originalQuery}" using either the ${suggestedApis[0]} or ${suggestedApis[1]}. Which one would you prefer to use?`;
    }

    const apiList =
      suggestedApis.slice(0, -1).join(", ") +
      ", or " +
      suggestedApis[suggestedApis.length - 1];
    return `I can help you with "${originalQuery}" using several APIs: ${apiList}. Which specific API would you like to use?`;
  }

  /**
   * Get API-specific context for enhanced search
   */
  getApiSpecificContext(apiName) {
    const apiContexts = {
      "REST Admin API":
        "Focus on REST endpoints, HTTP methods, request/response formats, authentication headers",
      "GraphQL Admin API":
        "Focus on GraphQL queries, mutations, schema, field selection, variables",
      "Storefront API":
        "Focus on customer-facing data, public endpoints, storefront queries",
      Webhooks:
        "Focus on event subscriptions, payload formats, security, delivery",
      "App Development":
        "Focus on app creation, authentication, permissions, app store",
      "Theme Development":
        "Focus on Liquid templates, theme structure, customization",
      Liquid: "Focus on template language, filters, objects, tags",
      "Checkout API":
        "Focus on payment processing, checkout flow, payment methods",
    };

    return apiContexts[apiName] || "General Shopify platform information";
  }
}

export default new ApiClarificationService();
