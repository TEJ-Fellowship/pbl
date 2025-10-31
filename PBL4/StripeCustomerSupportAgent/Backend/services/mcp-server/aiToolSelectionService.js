import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import config from "../../config/config.js";

dotenv.config();

/**
 * AI-Powered Tool Selection Service
 * Uses Gemini AI to intelligently select MCP tools based on user queries
 */
class AIToolSelectionService {
  constructor() {
    this.geminiClient = null;
    this.initializeGemini();
  }

  /**
   * Initialize Gemini AI client
   */
  initializeGemini() {
    try {
      if (!process.env.GEMINI_API_KEY) {
        console.warn(
          "⚠️ GEMINI_API_KEY not found. AI tool selection will be disabled."
        );
        return;
      }

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.geminiClient = genAI.getGenerativeModel({
        model: config.GEMINI_API_MODEL_2 || "gemini-2.0-flash-lite",
      });
      console.log(
        "✅ AI Tool Selection Service: Gemini AI initialized with model: ",
        config.GEMINI_API_MODEL_2
      );
    } catch (error) {
      console.error(
        "❌ AI Tool Selection Service: Failed to initialize Gemini:",
        error.message
      );
    }
  }

  /**
   * Generate dynamic tool detection prompt based on available tools
   * @param {Array} tools - Array of available MCP tools
   * @returns {string} - Generated prompt for AI tool selection
   */
  generateToolDetectionPrompt(tools) {
    if (!tools || tools.length === 0) {
      return `
You are an AI assistant that analyzes user messages for Stripe support queries. No MCP tools are currently available.
Respond with JSON:
{
  "useTool": false,
  "reasoning": "No tools available"
}
Only respond with JSON, nothing else.`;
    }

    const toolList = tools
      .map((tool) => {
        const params = tool.apiKeys || [];
        const dependencies = tool.dependencies || [];
        return `- ${tool.name}: ${tool.description}${
          params.length > 0 ? ` (requires: ${params.join(", ")})` : ""
        }${
          dependencies.length > 0
            ? ` (dependencies: ${dependencies.join(", ")})`
            : ""
        }`;
      })
      .join("\n");

    return `
You are an AI assistant that analyzes Stripe support queries and determines which MCP tools should be used.

Available MCP tools:
${toolList}

Context: This is a Stripe Customer Support Agent. Users ask questions about Stripe API, payments, webhooks, billing, disputes, etc.

Tool Selection Guidelines:
- calculator: Use for fee calculations, math operations, pricing questions, percentage calculations, mathematical expressions
- currency_converter: Use for currency conversions, exchange rates, "convert X to Y" queries
- status_checker: Use for system status, downtime, "is Stripe down" questions
- web_search: Use for recent updates, latest information, "what's new" questions
- code_validator: Use for code validation, API endpoint verification, syntax checking
- datetime: Use for time-related queries, business hours, scheduling

If the query requires using one or more tools, respond with JSON:
{
  "useTool": true,
  "tools": ["tool1", "tool2"],
  "reasoning": "Why these tools were selected",
  "confidence": 0.8
}

If no tools are needed, respond with:
{
  "useTool": false,
  "reasoning": "Query can be answered with documentation alone"
}

Only respond with JSON, nothing else.`;
  }

  /**
   * Make AI-powered tool selection decision
   * @param {string} query - User query
   * @param {Array} availableTools - Available MCP tools
   * @param {number} confidence - Document retrieval confidence
   * @returns {Object} - Tool selection decision
   */
  async makeToolDecision(query, availableTools, confidence = 0.5) {
    if (!this.geminiClient) {
      console.warn(
        "⚠️ Gemini AI not available, falling back to rule-based selection"
      );
      return this.fallbackRuleBasedSelection(query, availableTools, confidence);
    }

    try {
      console.log(
        `🤖 AI Tool Selection: Analyzing "${query}" with confidence ${confidence}`
      );

      // Generate dynamic prompt based on available tools
      const dynamicPrompt = this.generateToolDetectionPrompt(availableTools);

      // Create enhanced prompt with context
      const enhancedPrompt = `${dynamicPrompt}

        User Query: "${query}"
        Document Confidence: ${confidence}
        Current Time: ${new Date().toISOString()}

        Analyze this Stripe support query and determine which MCP tools should be used.`;

      // Get AI response
      const result = await this.geminiClient.generateContent(enhancedPrompt);
      const responseText = result.response.text();

      // Parse AI response
      const toolDecision = this.parseAIResponse(
        responseText,
        query,
        confidence
      );

      console.log(
        `✅ AI Tool Selection: ${
          toolDecision.useTool
            ? `Selected ${toolDecision.tools?.length || 0} tools`
            : "No tools needed"
        }`
      );
      return toolDecision;
    } catch (error) {
      console.error("❌ AI Tool Selection Error:", error.message);
      console.log("🔄 Falling back to rule-based selection...");
      return this.fallbackRuleBasedSelection(query, availableTools, confidence);
    }
  }

  /**
   * Parse AI response and extract tool decision
   * @param {string} responseText - Raw AI response
   * @param {string} query - Original query
   * @param {number} confidence - Document confidence
   * @returns {Object} - Parsed tool decision
   */
  parseAIResponse(responseText, query, confidence) {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }

      const toolDecision = JSON.parse(jsonMatch[0]);

      // Validate response structure
      if (!toolDecision.hasOwnProperty("useTool")) {
        throw new Error("Invalid AI response structure");
      }

      // Ensure tools array exists if useTool is true
      if (toolDecision.useTool && !toolDecision.tools) {
        toolDecision.tools = [];
      }

      // Add confidence and reasoning if missing
      if (!toolDecision.confidence) {
        toolDecision.confidence = confidence;
      }

      if (!toolDecision.reasoning) {
        toolDecision.reasoning = "AI analysis completed";
      }

      return toolDecision;
    } catch (parseError) {
      console.error("❌ Failed to parse AI response:", parseError.message);
      console.log("Raw response:", responseText);

      // Fallback to rule-based selection
      return this.fallbackRuleBasedSelection(query, [], confidence);
    }
  }

  /**
   * Fallback rule-based tool selection when AI is not available
   * @param {string} query - User query
   * @param {Array} availableTools - Available tools
   * @param {number} confidence - Document confidence
   * @returns {Object} - Rule-based tool decision
   */
  fallbackRuleBasedSelection(query, availableTools, confidence) {
    console.log("🔄 Using rule-based tool selection fallback");

    const tools = [];
    const lowerQuery = query.toLowerCase();

    // Rule-based patterns (similar to current implementation)
    if (lowerQuery.match(/\d+\.\d+%|\$\d+|\b(fee|cost|price|calculate|math)/)) {
      tools.push("calculator");
    }

    if (
      lowerQuery.match(/(down|status|working|operational|issues|not working)/)
    ) {
      tools.push("status_checker");
    }

    if (lowerQuery.match(/(latest|recent|new|updated|2024|2025)/)) {
      tools.push("web_search");
    }

    if (lowerQuery.match(/(validate|check|verify|endpoint|api|code)/)) {
      tools.push("code_validator");
    }

    if (lowerQuery.match(/(time|date|schedule|business hours|when)/)) {
      tools.push("datetime");
    }

    // Low confidence fallback
    if (confidence < 0.6 && !tools.includes("web_search")) {
      tools.push("web_search");
    }

    return {
      useTool: tools.length > 0,
      tools: tools,
      reasoning: "Rule-based pattern matching",
      confidence: confidence,
    };
  }

  /**
   * Get tool selection statistics
   * @returns {Object} - Statistics about tool selection
   */
  getStats() {
    return {
      available: !!this.geminiClient,
      geminiAvailable: !!this.geminiClient,
      model: this.geminiClient ? "gemini-2.0-flash-lite" : "unavailable",
      aiDecisions: this.aiDecisions || 0,
      fallbackDecisions: this.fallbackDecisions || 0,
      totalDecisions: (this.aiDecisions || 0) + (this.fallbackDecisions || 0),
    };
  }
}

export default AIToolSelectionService;
