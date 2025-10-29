/**
 * Query Classifier - LLM-based routing system
 *
 * Uses Gemini AI to classify user queries and route them to the appropriate handler:
 * - MCP: Direct answer using a specific MCP tool
 * - Hybrid: Documentation search from scraped Twilio docs
 * - Combined: Both MCP tool + Hybrid search together
 * - General: Web search for latest/external information
 *
 * This replaces rule-based routing with intelligent LLM decisions.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/config.js";

class QueryClassifier {
  constructor() {
    if (!config.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    this.geminiClient = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = this.geminiClient.getGenerativeModel({
      model: "gemini-2.0-flash",
    });
  }

  /**
   * Classify a query and determine routing
   *
   * @param {string} query - User's query
   * @param {Object} enhancements - Enhancements from QueryEnhancer
   * @returns {Promise<Object>} Classification result with route, tool, confidence, etc.
   */
  async classify(query, enhancements = {}) {
    try {
      // Build classification prompt
      const prompt = this.buildClassificationPrompt(query, enhancements);

      // Get classification from Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const classification = this.parseClassification(text);

      // Validate classification
      return this.validateClassification(classification);
    } catch (error) {
      console.error("❌ Query classification failed:", error.message);

      // Fallback to hybrid search on error
      return {
        route: "hybrid",
        confidence: 0.5,
        reasoning: "Classification failed, defaulting to hybrid search",
        mcpTool: null,
        hybridQuery: query,
      };
    }
  }

  /**
   * Build the classification prompt for Gemini
   */
  buildClassificationPrompt(query, enhancements) {
    return `You are a query classifier for a Twilio developer support system. Your task is to classify user queries and route them to the appropriate handler.

## Available Routes:

### 1. MCP Route
Use when a single MCP tool can directly answer the query with structured information.
**When to use:**
- Error code lookups ("What does error 30001 mean?")
- Code validation requests ("Validate this code")
- Status checks ("Is Twilio down?")
- Webhook signature validation ("Is this webhook signature valid?")
- Rate limit calculations ("Will I exceed rate limits?")
- Code execution/testing ("Run this code")
- Time queries ("What time is it?", "What's the current time?")

### 2. Hybrid Search Route
Use when query needs documentation lookup from scraped Twilio documentation.
**When to use:**
- How-to questions ("How do I send SMS?")
- API usage explanations ("How does webhook verification work?")
- Setup/tutorial questions ("How to set up Twilio?")
- General documentation queries about Twilio features
- Conceptual questions requiring documentation context

### 3. Combined Search Route
Use when query needs BOTH an MCP tool result AND documentation context.
**When to use:**
- Error code + solution ("What does error 30001 mean and how do I fix it?")
- Validation + explanation ("Validate this code and explain webhook signatures")
- Status + documentation ("Is SMS down and what's the alternative?")
- Any query that explicitly needs tool result + documentation together

### 4. General Search Route
Use when query needs latest information, updates, or external resources not in scraped docs.
**When to use:**
- "Latest Twilio updates"
- "Recent Twilio outages"
- "What's new in Twilio?"
- Questions about recent changes
- When user explicitly asks for current/latest information

---

## Available MCP Tools (for MCP or Combined routes):

1. **lookup_error_code**
   - Description: Look up Twilio error codes and provide detailed explanations
   - Input: errorCode (string) - e.g., "30001", "20003"
   - Use for: "What does error X mean?", error code questions

2. **validate_twilio_code**
   - Description: Validate Twilio API code snippets and check for common issues
   - Input: code (string), language (string, optional)
   - Use for: "Validate this code", "Is this code correct?", code review requests

3. **check_twilio_status**
   - Description: Check Twilio service status for disruptions or maintenance
   - Input: service (string, optional) - e.g., "sms", "voice"
   - Use for: "Is Twilio down?", "Check SMS service status", status questions

4. **validate_webhook_signature**
   - Description: Validate Twilio webhook signatures and payload formats
   - Input: signature, url, payload, authToken (all required)
   - Use for: "Validate this webhook", "Is this signature valid?", webhook validation

5. **calculate_rate_limits**
   - Description: Calculate if API usage will exceed Twilio rate limits
   - Input: apiType, requestsPerSecond, requestsPerMinute, accountTier (optional)
   - Use for: "Will I exceed rate limits?", rate limit calculations

6. **execute_twilio_code**
   - Description: Execute Twilio API calls in sandboxed test mode
   - Input: code (string), language (string), testMode (boolean, optional)
   - Use for: "Run this code", "Test this code", code execution requests

7. **get_current_time**
   - Description: Get the current date and time
   - Input: none
   - Use for: "What time is it?", "What's the current time?", time queries

---

## Query Analysis:
**Query:** ${query}

**Detected Enhancements:**
- Language: ${enhancements.detectedLanguage || "not detected"}
- API: ${enhancements.detectedAPI || "not detected"}
- Error Codes: ${enhancements.errorCodes?.join(", ") || "none"}
- Focus: ${enhancements.suggestedFocus || "general"}
- Confidence: ${enhancements.confidence || 0.5}

---

## Your Task:
Analyze the query and classify it. Respond with ONLY valid JSON in this exact format:

{
  "route": "mcp" | "hybrid" | "combined" | "general",
  "mcpTool": "tool_name" | null,
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this route was chosen",
  "hybridQuery": "refined query for hybrid search (if route is hybrid/combined, otherwise null)"
}

## Examples:

**Example 1:**
Query: "What does error code 30001 mean?"
Response:
{
  "route": "mcp",
  "mcpTool": "lookup_error_code",
  "confidence": 0.95,
  "reasoning": "Direct error code lookup question, lookup_error_code tool can answer directly",
  "hybridQuery": null
}

**Example 2:**
Query: "How do I send SMS in Node.js?"
Response:
{
  "route": "hybrid",
  "mcpTool": null,
  "confidence": 0.9,
  "reasoning": "Documentation question requiring how-to guide from Twilio docs",
  "hybridQuery": "How do I send SMS in Node.js?"
}

**Example 3:**
Query: "What does error 30001 mean and how do I fix it?"
Response:
{
  "route": "combined",
  "mcpTool": "lookup_error_code",
  "confidence": 0.9,
  "reasoning": "Requires both error code lookup (MCP) and documentation for solution (Hybrid)",
  "hybridQuery": "How to fix error 30001 queue overflow rate limiting"
}

**Example 4:**
Query: "Latest Twilio SMS API updates"
Response:
{
  "route": "general",
  "mcpTool": null,
  "confidence": 0.85,
  "reasoning": "Query about latest updates requires web search for current information",
  "hybridQuery": null
}

**Example 5:**
Query: "What time is it?"
Response:
{
  "route": "mcp",
  "mcpTool": "get_current_time",
  "confidence": 0.95,
  "reasoning": "Direct time query, get_current_time tool can answer directly",
  "hybridQuery": null
}

---

Now classify this query and respond with ONLY the JSON object, no other text:`;
  }

  /**
   * Parse classification response from Gemini
   * Handles cases where response might have markdown code blocks
   */
  parseClassification(text) {
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();

      // Try to extract JSON from code blocks
      const jsonMatch = cleanText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        cleanText = jsonMatch[1];
      } else {
        // Try to find JSON object
        const braceMatch = cleanText.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          cleanText = braceMatch[0];
        }
      }

      return JSON.parse(cleanText);
    } catch (error) {
      console.error("Failed to parse classification JSON:", error.message);
      console.error("Raw response:", text);
      throw new Error(
        `Invalid JSON response from classifier: ${error.message}`
      );
    }
  }

  /**
   * Validate classification result
   */
  validateClassification(classification) {
    const validRoutes = ["mcp", "hybrid", "combined", "general"];
    const validTools = [
      "lookup_error_code",
      "validate_twilio_code",
      "check_twilio_status",
      "validate_webhook_signature",
      "calculate_rate_limits",
      "execute_twilio_code",
      "get_current_time",
    ];

    // Validate route
    if (!validRoutes.includes(classification.route)) {
      throw new Error(`Invalid route: ${classification.route}`);
    }

    // If route is mcp or combined, mcpTool must be specified
    if (
      (classification.route === "mcp" || classification.route === "combined") &&
      (!classification.mcpTool || !validTools.includes(classification.mcpTool))
    ) {
      throw new Error(
        `Route ${classification.route} requires valid mcpTool, got: ${classification.mcpTool}`
      );
    }

    // If route is hybrid or combined, hybridQuery should be present
    if (
      (classification.route === "hybrid" ||
        classification.route === "combined") &&
      !classification.hybridQuery
    ) {
      // Use original query as fallback
      classification.hybridQuery = classification.hybridQuery || "query";
    }

    // Ensure confidence is a number
    if (typeof classification.confidence !== "number") {
      classification.confidence = 0.5;
    }

    // Ensure confidence is between 0 and 1
    classification.confidence = Math.max(
      0,
      Math.min(1, classification.confidence)
    );

    // Ensure reasoning exists
    if (!classification.reasoning) {
      classification.reasoning = "Classification completed";
    }

    return classification;
  }
}

export default QueryClassifier;
