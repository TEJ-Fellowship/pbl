import CalculatorTool from "../mcp-tools/calculatorTool.js";
import StatusCheckerTool from "../mcp-tools/statusCheckerTool.js";
import WebSearchTool from "../mcp-tools/webSearchTool.js";
import CodeValidatorTool from "../mcp-tools/codeValidatorTool.js";
import DateTimeTool from "../mcp-tools/dateTimeTool.js";
import CurrencyConverterTool from "../mcp-tools/currencyConverterTool.js";
import AIToolSelectionService from "./aiToolSelectionService.js";
import MCPClient from "../mcp-client/mcpClient.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * MCP Agent Orchestrator
 * Coordinates multiple MCP tools using MCP protocol (not direct calls)
 */
class AgentOrchestrator {
  constructor() {
    this.tools = new Map(); // Keep for tool info/config, but execution via MCP
    this.mcpClient = new MCPClient();
    this.aiToolSelection = new AIToolSelectionService();
    this.isInitialized = false;
    this.initializeTools(); // Initialize tool references for config/metadata
  }

  /**
   * Initialize MCP client connection
   */
  async initialize() {
    if (this.isInitialized) {
      console.log("✅ [AgentOrchestrator] Already initialized");
      return true;
    }

    try {
      console.log("🔧 [AgentOrchestrator] Initializing MCP connection...");

      const serverScript = path.join(__dirname, "mcpServer.js");
      const serverConfig = {
        command: "node",
        args: [serverScript],
        env: {
          ...process.env,
        },
      };

      console.log(`📋 [AgentOrchestrator] Server script: ${serverScript}`);
      console.log(
        `📋 [AgentOrchestrator] Server script exists: ${fs.existsSync(
          serverScript
        )}`
      );
      console.log(
        `📋 [AgentOrchestrator] Full path: ${path.resolve(serverScript)}`
      );

      this.isInitialized = await this.mcpClient.initialize(serverConfig);

      if (this.isInitialized) {
        console.log("✅ [AgentOrchestrator] MCP orchestrator ready");
        const availableTools = this.mcpClient.getAvailableTools();
        console.log(
          `📋 [AgentOrchestrator] Tools from client: ${availableTools.join(
            ", "
          )}`
        );
      } else {
        console.error("❌ [AgentOrchestrator] Initialization failed");
        console.error(
          "❌ [AgentOrchestrator] MCP client connected:",
          this.mcpClient.isConnected
        );
        console.error(
          "❌ [AgentOrchestrator] MCP client ready:",
          this.mcpClient.isReady()
        );
      }

      return this.isInitialized;
    } catch (error) {
      console.error(
        "❌ [AgentOrchestrator] Initialization error:",
        error.message
      );
      console.error("❌ [AgentOrchestrator] Error stack:", error.stack);
      this.isInitialized = false;
      return false;
    }
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
   *3. Fallback rule-based tool selection (pattern-based)
   * @param {string} query - User query
   * @param {number} confidence - Document confidence
   * @param {Array} enabledTools - Enabled tools
   * @returns {Array} - Selected tools
   */
  fallbackRuleBasedSelection(query, confidence = 0.5, enabledTools = null) {
    const toolDecisions = [];

    console.log("🔄 [AgentOrchestrator] Using rule-based fallback selection");

    // Low confidence fallback to web search
    if (confidence < 0.6 && !toolDecisions.includes("web_search")) {
      if (!enabledTools || enabledTools.includes("web_search")) {
        toolDecisions.push("web_search");
        console.log(
          "✅ [AgentOrchestrator] web_search triggered by low confidence"
        );
      }
    }

    // Pattern-based tool selection
    if (this.hasMathPatterns(query) && !toolDecisions.includes("calculator")) {
      if (!enabledTools || enabledTools.includes("calculator")) {
        toolDecisions.push("calculator");
        console.log(
          "✅ [AgentOrchestrator] calculator triggered by math patterns"
        );
      }
    }

    if (
      this.hasStatusPatterns(query) &&
      !toolDecisions.includes("status_checker")
    ) {
      if (!enabledTools || enabledTools.includes("status_checker")) {
        toolDecisions.push("status_checker");
        console.log(
          "✅ [AgentOrchestrator] status_checker triggered by status patterns"
        );
      }
    }

    if (
      this.hasCodePatterns(query) &&
      !toolDecisions.includes("code_validator")
    ) {
      if (!enabledTools || enabledTools.includes("code_validator")) {
        toolDecisions.push("code_validator");
        console.log(
          "✅ [AgentOrchestrator] code_validator triggered by code patterns"
        );
      }
    }

    if (this.hasTimePatterns(query) && !toolDecisions.includes("datetime")) {
      if (!enabledTools || enabledTools.includes("datetime")) {
        toolDecisions.push("datetime");
        console.log(
          "✅ [AgentOrchestrator] datetime triggered by time patterns"
        );
      }
    }

    console.log(
      `🎯 [AgentOrchestrator] Rule-based selection complete: ${toolDecisions.length} tools selected`
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
   * 4. Execute selected tools via MCP protocol
   * @param {Array} toolNames - Array of tool names to execute
   * @param {string} query - User query
   * @returns {Object} - Combined tool results
   */
  async executeTools(toolNames, query) {
    // Ensure MCP client is initialized
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error("MCP orchestrator not initialized");
      }
    }

    console.log(
      `🚀 [AgentOrchestrator] Executing ${toolNames.length} tools via MCP protocol...`
    );

    const results = {};
    const errors = [];

    // Execute tools via MCP protocol (not direct calls)
    const toolPromises = toolNames.map(async (toolName) => {
      try {
        console.log(`⚙️ [AgentOrchestrator] Executing ${toolName} via MCP...`);

        // Call tool via MCP protocol instead of direct method call
        const mcpResult = await this.mcpClient.callTool(toolName, {
          query: query,
        });

        console.log(`📥 [AgentOrchestrator] ${toolName} MCP result:`, {
          success: mcpResult.success,
          hasParsedResult: !!mcpResult.parsedResult,
        });

        if (mcpResult.success && mcpResult.parsedResult) {
          return {
            toolName,
            result: mcpResult.parsedResult,
            success: true,
          };
        } else {
          throw new Error(mcpResult.error || "MCP tool call failed");
        }
      } catch (error) {
        console.error(
          `❌ [AgentOrchestrator] ${toolName} error:`,
          error.message
        );
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
        console.log(
          `✅ [AgentOrchestrator] ${toolName} completed - Confidence: ${(
            result.confidence * 100
          ).toFixed(1)}%`
        );
      } else {
        errors.push({ toolName, error });
      }
    });

    // Generate combined response
    const combinedResponse = this.formatToolResults(results, errors);
    const overallConfidence = this.calculateOverallConfidence(results);

    console.log(
      `✅ [AgentOrchestrator] Execution complete - Overall confidence: ${(
        overallConfidence * 100
      ).toFixed(1)}%`
    );

    return {
      success: true,
      results,
      errors,
      combinedResponse,
      overallConfidence,
      toolsUsed: toolNames,
      message: combinedResponse,
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
   * Check if ready (MCP client connected)
   * @returns {boolean}
   */
  isReady() {
    return this.isInitialized && (this.mcpClient?.isReady() || false);
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

  /**
   * Close MCP connection
   */
  async close() {
    if (this.mcpClient) {
      await this.mcpClient.close();
    }
    this.isInitialized = false;
    console.log("🔌 [AgentOrchestrator] MCP connection closed");
  }
}

export default AgentOrchestrator;
