import CalculatorTool from "../mcp-tools/calculatorTool.js";
import StatusCheckerTool from "../mcp-tools/statusCheckerTool.js";
import WebSearchTool from "../mcp-tools/webSearchTool.js";
import CodeValidatorTool from "../mcp-tools/codeValidatorTool.js";
import DateTimeTool from "../mcp-tools/dateTimeTool.js";
import CurrencyConverterTool from "../mcp-tools/currencyConverterTool.js";
import AIToolSelectionService from "./aiToolSelectionService.js";

/**
 * MCP Agent Orchestrator
 * Coordinates multiple MCP tools for intelligent Stripe support
 */
class AgentOrchestrator {
  constructor() {
    this.tools = new Map();
    this.aiToolSelection = new AIToolSelectionService();
    this.initializeTools();
  }

  /**
   * 1. Initialize all MCP tools
   */
  initializeTools() {
    console.log("🔧 Initializing MCP Tools...");

    // Initialize individual tools
    this.tools.set("calculator", new CalculatorTool());
    this.tools.set("status_checker", new StatusCheckerTool());
    this.tools.set("web_search", new WebSearchTool());
    this.tools.set("code_validator", new CodeValidatorTool());
    this.tools.set("datetime", new DateTimeTool());
    this.tools.set("currency_converter", new CurrencyConverterTool());

    console.log(`✅ Initialized ${this.tools.size} MCP tools`);
  }

  /**
   * 2. Decide which tools to use based on query and confidence
   * @param {string} query - User query
   * @param {number} confidence - Document retrieval confidence (0-1)
   * @param {Array} enabledTools - Array of enabled tool names
   * @returns {Array} - Array of tool names to use
   */
  async decideToolUse(query, confidence = 0.5, enabledTools = null) {
    console.log(
      `🤖 AI-Powered Tool Selection: Analyzing "${query}" (confidence: ${confidence})`
    );

    try {
      // Get available tools configuration
      const availableTools = this.getAvailableToolsConfig(enabledTools);

      // Use AI to make tool selection decision
      const aiDecision = await this.aiToolSelection.makeToolDecision(
        query,
        availableTools,
        confidence
      );

      if (!aiDecision.useTool) {
        console.log("🤖 AI Decision: No tools needed");
        return [];
      }

      // Filter selected tools by enabled tools
      const selectedTools = aiDecision.tools || [];
      const filteredTools = enabledTools
        ? selectedTools.filter((tool) => enabledTools.includes(tool))
        : selectedTools;

      console.log(
        `🤖 AI Decision: Selected ${
          filteredTools.length
        } tools: ${filteredTools.join(", ")}`
      );
      console.log(`🤖 AI Reasoning: ${aiDecision.reasoning}`);
      console.log(`🤖 AI Confidence: ${aiDecision.confidence}`);

      return filteredTools;
    } catch (error) {
      console.error("❌ AI Tool Selection Error:", error.message);
      console.log("🔄 Falling back to rule-based selection...");

      // Fallback to original rule-based method
      return this.fallbackRuleBasedSelection(query, confidence, enabledTools);
    }
  }

  /**
   *3. Fallback rule-based tool selection (original implementation)
   * @param {string} query - User query
   * @param {number} confidence - Document confidence
   * @param {Array} enabledTools - Enabled tools
   * @returns {Array} - Selected tools
   */
  fallbackRuleBasedSelection(query, confidence = 0.5, enabledTools = null) {
    const toolDecisions = [];

    console.log("🔄 Using rule-based fallback selection");

    // Always check if tools should be used based on query content
    for (const [toolName, tool] of this.tools) {
      // Check if tool is enabled (if enabledTools array is provided)
      if (enabledTools && !enabledTools.includes(toolName)) {
        console.log(`❌ ${toolName} skipped (disabled)`);
        continue;
      }

      if (tool.shouldUse && tool.shouldUse(query)) {
        toolDecisions.push(toolName);
        console.log(`✅ ${toolName} triggered by query content`);
      }
    }

    // Low confidence fallback to web search (only if enabled)
    if (confidence < 0.6 && !toolDecisions.includes("web_search")) {
      if (!enabledTools || enabledTools.includes("web_search")) {
        toolDecisions.push("web_search");
        console.log("✅ web_search triggered by low confidence");
      } else {
        console.log(
          "❌ web_search skipped (disabled) - low confidence fallback"
        );
      }
    }

    // High confidence queries might still benefit from specific tools
    if (confidence >= 0.6) {
      // Check for specific patterns that warrant tool usage
      if (
        this.hasMathPatterns(query) &&
        !toolDecisions.includes("calculator")
      ) {
        toolDecisions.push("calculator");
        console.log("✅ calculator triggered by math patterns");
      }

      if (
        this.hasStatusPatterns(query) &&
        !toolDecisions.includes("status_checker")
      ) {
        toolDecisions.push("status_checker");
        console.log("✅ status_checker triggered by status patterns");
      }

      if (
        this.hasCodePatterns(query) &&
        !toolDecisions.includes("code_validator")
      ) {
        toolDecisions.push("code_validator");
        console.log("✅ code_validator triggered by code patterns");
      }

      if (this.hasTimePatterns(query) && !toolDecisions.includes("datetime")) {
        toolDecisions.push("datetime");
        console.log("✅ datetime triggered by time patterns");
      }
    }

    console.log(
      `🎯 Rule-based selection complete: ${toolDecisions.length} tools selected`
    );
    return toolDecisions;
  }

  /**
   * 3.1 Get available tools configuration for AI selection
   * @param {Array} enabledTools - Enabled tools
   * @returns {Array} - Tools configuration
   */
  getAvailableToolsConfig(enabledTools = null) {
    const toolsConfig = [];

    for (const [toolName, tool] of this.tools) {
      // Skip if tool is disabled
      if (enabledTools && !enabledTools.includes(toolName)) {
        continue;
      }

      // Get tool configuration
      const config = {
        name: toolName,
        description: tool.description || `${toolName} tool`,
        apiKeys: this.getToolApiKeys(toolName),
        dependencies: this.getToolDependencies(toolName),
      };

      toolsConfig.push(config);
    }

    return toolsConfig;
  }

  /**
   * 3.2 Get API keys required for a tool
   * @param {string} toolName - Tool name
   * @returns {Array} - Required API keys
   */
  getToolApiKeys(toolName) {
    const apiKeyMap = {
      web_search: ["GOOGLE_SEARCH_API_KEY", "GOOGLE_SEARCH_ENGINE_ID"],
      status_checker: ["STRIPE_SECRET_KEY"],
      calculator: [],
      code_validator: [],
      datetime: [],
    };

    return apiKeyMap[toolName] || [];
  }

  /**
   * 3.3 Get dependencies for a tool
   * @param {string} toolName - Tool name
   * @returns {Array} - Tool dependencies
   */
  getToolDependencies(toolName) {
    const dependencyMap = {
      web_search: ["axios"],
      status_checker: ["axios"],
      calculator: ["mathjs"],
      code_validator: [],
      datetime: ["date-fns"],
    };

    return dependencyMap[toolName] || [];
  }

  /**
   * 4. Execute selected tools
   * @param {Array} toolNames - Array of tool names to execute
   * @param {string} query - User query
   * @returns {Object} - Combined tool results
   */
  async executeTools(toolNames, query) {
    const results = {};
    const errors = [];

    console.log(`🚀 Executing ${toolNames.length} tools...`);

    // Execute tools in parallel for better performance
    const toolPromises = toolNames.map(async (toolName) => {
      try {
        const tool = this.tools.get(toolName);
        if (!tool) {
          throw new Error(`Tool ${toolName} not found`);
        }

        console.log(`⚙️  Executing ${toolName}...`);
        const result = await tool.execute(query);

        return {
          toolName,
          result,
          success: true,
        };
      } catch (error) {
        console.error(`❌ Error executing ${toolName}:`, error.message);
        return {
          toolName,
          result: null,
          success: false,
          error: error.message,
        };
      }
    });

    const toolResults = await Promise.all(toolPromises);

    // Process results
    toolResults.forEach(({ toolName, result, success, error }) => {
      if (success && result) {
        results[toolName] = result;
      } else {
        errors.push({ toolName, error });
      }
    });

    // Generate combined response using the better formatToolResults method
    const combinedResponse = this.formatToolResults(results, errors);
    const overallConfidence = this.calculateOverallConfidence(results);

    return {
      success: true,
      results,
      errors,
      combinedResponse,
      overallConfidence,
      toolsUsed: toolNames,
      message: combinedResponse, // Use the same formatted response
    };
  }

  /**
   * Check for mathematical patterns in query
   * @param {string} query - User query
   * @returns {boolean} - Whether query has math patterns
   * @note Could be optimized by consolidating with other pattern functions, but kept separate for clarity
   */
  hasMathPatterns(query) {
    const mathPatterns = [
      /\d+\.\d+%/, // Percentages
      /\$\d+/, // Dollar amounts
      /calculate|compute/, // Math keywords
      /fee|cost|price/, // Financial terms
      /[\+\-\*\/]/, // Math operators
      /percent|percentage/, // Percentage keywords
    ];

    return mathPatterns.some((pattern) => pattern.test(query.toLowerCase()));
  }

  /**
   * Check for status-related patterns in query
   * @param {string} query - User query
   * @returns {boolean} - Whether query has status patterns
   */
  hasStatusPatterns(query) {
    const statusPatterns = [
      /down|not working|broken/,
      /status|outage|incident/,
      /maintenance|scheduled/,
      /issue|problem|error/,
      /stripe.*down|stripe.*not working/,
    ];

    return statusPatterns.some((pattern) => pattern.test(query.toLowerCase()));
  }

  /**
   * Check for code-related patterns in query
   * @param {string} query - User query
   * @returns {boolean} - Whether query has code patterns
   */
  hasCodePatterns(query) {
    const codePatterns = [
      /\/v1\//, // API endpoints
      /api\.stripe\.com/, // Stripe API URLs
      /curl|fetch|axios/, // HTTP client code
      /sk_|pk_|rk_/, // API keys
      /```|`[^`]+`/, // Code blocks
      /javascript|node\.js|python/, // Programming languages
    ];

    return codePatterns.some((pattern) => pattern.test(query.toLowerCase()));
  }

  /**
   * Check for time-related patterns in query
   * @param {string} query - User query
   * @returns {boolean} - Whether query has time patterns
   */
  hasTimePatterns(query) {
    const timePatterns = [
      /now|currently|right now/,
      /today|yesterday|tomorrow/,
      /time|date|when/,
      /business hours|weekend/,
      /down.*now|not working.*now/,
    ];

    return timePatterns.some((pattern) => pattern.test(query.toLowerCase()));
  }

  /**
   * Generate combined response from all tool results
   * @param {Object} results - Tool results
   * @param {string} query - Original query
   * @returns {string} - Combined response
   * @deprecated Use formatToolResults() instead for better error handling
   */
  generateCombinedResponse(results, query) {
    // This function is redundant with formatToolResults()
    // Keeping for backward compatibility but should use formatToolResults() instead
    return this.formatToolResults(results, []);
  }

  /**
   * Calculate overall confidence from tool results
   * @param {Object} results - Tool results
   * @returns {number} - Overall confidence (0-1)
   */
  calculateOverallConfidence(results) {
    const confidences = Object.values(results)
      .filter((result) => result && typeof result.confidence === "number")
      .map((result) => result.confidence);

    if (confidences.length === 0) return 0.5;

    return (
      confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
    );
  }

  /**
   * Format tool results for display
   * @param {Object} results - Tool results
   * @param {Array} errors - Tool errors
   * @returns {string} - Formatted results
   */
  formatToolResults(results, errors) {
    let message = "";

    // Add successful tool results
    Object.entries(results).forEach(([toolName, result]) => {
      if (result && result.success) {
        message += `✅ **${toolName}**: ${result.message}\n\n`;
      }
    });

    // Add error information
    if (errors.length > 0) {
      message += "❌ **Tool Errors:**\n";
      errors.forEach(({ toolName, error }) => {
        message += `• ${toolName}: ${error}\n`;
      });
    }

    return message.trim();
  }

  /**
   * Get tool information
   * @returns {Object} - Tool information
   */
  getToolInfo() {
    const toolInfo = {};

    for (const [name, tool] of this.tools) {
      toolInfo[name] = {
        name: tool.name,
        description: tool.description,
        available: true,
      };
    }

    return toolInfo;
  }

  /**
   * Check if any tools are available
   * @returns {boolean} - Whether any tools are available
   */
  hasAvailableTools() {
    return this.tools.size > 0;
  }

  /**
   * Get available tool names
   * @returns {Array} - Array of tool names
   */
  getAvailableTools() {
    return Array.from(this.tools.keys());
  }
}

export default AgentOrchestrator;
