import AgentOrchestrator from "./mcp-server/agentOrchestrator.js";
import ToolConfigManager from "./mcp-server/toolConfigManager.js";
import config from "../config/config.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * MCP Integration Service
 * Integrates MCP tools with the existing Stripe support system
 */
class MCPIntegrationService {
  constructor() {
    this.orchestrator = new AgentOrchestrator();
    this.toolConfigManager = new ToolConfigManager();
    this.isEnabled = false;
    this.toolUsageStats = new Map();
    this.initialize();
  }

  /**
   * Initialize the MCP integration service
   */
  async initialize() {
    try {
      await this.toolConfigManager.initialize();
      this.isEnabled = this.checkMCPAvailability();
      console.log(
        "✅ MCP Integration Service: Initialized with tool configuration"
      );
    } catch (error) {
      console.error(
        "❌ MCP Integration Service: Failed to initialize:",
        error.message
      );
      this.isEnabled = false;
    }
  }

  /**
   * Check if MCP tools are available and properly configured
   * @returns {boolean} - Whether MCP is available
   */
  checkMCPAvailability() {
    try {
      // Check if orchestrator is properly initialized
      if (!this.orchestrator.hasAvailableTools()) {
        console.warn("⚠️ MCP Integration: No tools available");
        return false;
      }

      // Ensure tool configuration is loaded
      if (!this.toolConfigManager || !this.toolConfigManager.config) {
        console.warn("⚠️ MCP Integration: Tool configuration not loaded");
        return false;
      }

      // Check if there are any enabled tools
      const enabledTools = this.getEnabledTools();
      if (enabledTools.length === 0) {
        console.warn("⚠️ MCP Integration: No tools are currently enabled");
        return false;
      }

      // Check for required environment variables only for enabled tools
      const enabledConfigs = this.getAllToolConfigs();
      const missingVars = [];

      for (const [toolName, config] of Object.entries(enabledConfigs)) {
        if (this.isToolEnabled(toolName)) {
          for (const apiKey of config.apiKeys) {
            if (!process.env[apiKey]) {
              missingVars.push(apiKey);
            }
          }
        }
      }

      if (missingVars.length > 0) {
        console.warn(
          `⚠️ MCP Integration: Missing environment variables for enabled tools: ${missingVars.join(
            ", "
          )}`
        );
        return false;
      }

      console.log("✅ MCP Integration: Available and configured");
      return true;
    } catch (error) {
      console.error("❌ MCP Integration: Configuration error:", error.message);
      return false;
    }
  }

  /**
   * Process user query with MCP tools
   * @param {string} query - User query
   * @param {number} confidence - Document retrieval confidence
   * @param {Object} context - Additional context
   * @returns {Object} - Enhanced response with MCP tool results
   */
  async processQueryWithMCP(query, confidence = 0.5, context = {}) {
    if (!this.isEnabled) {
      return {
        success: false,
        message: "MCP tools not available",
        enhancedResponse: null,
      };
    }

    try {
      console.log(
        `\n🔧 MCP Integration: Processing query with confidence ${confidence}`
      );
      console.log("-".repeat(40));

      // Get enabled tools from tool configuration
      const enabledTools = this.getEnabledTools();

      // Decide which tools to use
      const toolNames = await this.orchestrator.decideToolUse(
        query,
        confidence,
        enabledTools
      );

      if (toolNames.length === 0) {
        return {
          success: true,
          message: "No MCP tools needed for this query",
          enhancedResponse: null,
          toolsUsed: [],
        };
      }

      // Execute selected tools
      const toolResults = await this.orchestrator.executeTools(
        toolNames,
        query
      );

      // Update usage statistics
      this.updateToolUsageStats(toolNames);

      // Generate enhanced response
      const enhancedResponse = this.generateEnhancedResponse(
        toolResults,
        query,
        confidence
      );

      return {
        success: true,
        message: "MCP tools executed successfully",
        enhancedResponse,
        toolResults,
        toolsUsed: toolNames,
        confidence: toolResults.overallConfidence,
      };
    } catch (error) {
      console.error("❌ MCP Integration Error:", error);
      return {
        success: false,
        message: `MCP processing failed: ${error.message}`,
        enhancedResponse: null,
      };
    }
  }

  /**
   * Generate enhanced response combining document retrieval with MCP tool results
   * @param {Object} toolResults - MCP tool results
   * @param {string} query - Original query
   * @param {number} confidence - Document confidence
   * @returns {string} - Enhanced response
   */
  generateEnhancedResponse(toolResults, query, confidence) {
    let response = "";

    // Add MCP tool results if available
    if (toolResults.results && Object.keys(toolResults.results).length > 0) {
      response += "🔧 **Additional Intelligence:**\n\n";
      response += toolResults.combinedResponse;
      response += "\n\n";
    }

    // Add confidence indicator
    if (confidence < 0.6) {
      response +=
        "⚠️ **Note**: This response includes additional web search results due to lower confidence in documentation retrieval.\n\n";
    }

    // Add tool usage information
    if (toolResults.toolsUsed && toolResults.toolsUsed.length > 0) {
      response += `🛠️ **Tools Used**: ${toolResults.toolsUsed.join(", ")}\n\n`;
    }

    return response.trim();
  }

  /**
   * Update tool usage statistics
   * @param {Array} toolNames - Tools that were used
   */
  updateToolUsageStats(toolNames) {
    toolNames.forEach((toolName) => {
      const currentCount = this.toolUsageStats.get(toolName) || 0;
      this.toolUsageStats.set(toolName, currentCount + 1);
    });
  }

  /**
   * Get tool usage statistics
   * @returns {Object} - Usage statistics
   */
  getToolUsageStats() {
    const stats = {};
    for (const [toolName, count] of this.toolUsageStats) {
      stats[toolName] = count;
    }
    return stats;
  }

  /**
   * Get available MCP tools information
   * @returns {Object} - Tool information
   */
  getAvailableTools() {
    if (!this.isEnabled) {
      return { error: "MCP tools not available" };
    }

    return this.orchestrator.getToolInfo();
  }

  /**
   * Test MCP tool functionality
   * @param {string} testQuery - Test query
   * @returns {Object} - Test results
   */
  async testMCPTools(testQuery = "What's Stripe's fee for $100?") {
    // Check current availability status
    const isCurrentlyEnabled = this.checkMCPAvailability();
    if (!isCurrentlyEnabled) {
      return {
        success: false,
        message: "MCP integration is disabled",
      };
    }

    // Check if there are any enabled tools
    const enabledTools = this.getEnabledTools();
    if (enabledTools.length === 0) {
      return {
        success: false,
        message: "No MCP tools are currently enabled",
      };
    }

    try {
      console.log(`🧪 Testing MCP tools with query: "${testQuery}"`);

      const result = await this.processQueryWithMCP(testQuery, 0.5);

      return {
        success: true,
        testQuery,
        result,
        toolsAvailable: enabledTools,
        message: "MCP tools test completed",
      };
    } catch (error) {
      return {
        success: false,
        message: `MCP tools test failed: ${error.message}`,
      };
    }
  }

  /**
   * Check if specific tool is available
   * @param {string} toolName - Tool name
   * @returns {boolean} - Whether tool is available
   */
  isToolAvailable(toolName) {
    if (!this.isEnabled) return false;
    return this.orchestrator.getAvailableTools().includes(toolName);
  }

  /**
   * Get MCP integration status
   * @returns {Object} - Integration status
   */
  getIntegrationStatus() {
    return {
      enabled: this.isEnabled,
      toolsAvailable: this.orchestrator.getAvailableTools(),
      toolUsageStats: this.getToolUsageStats(),
      configuration: {
        googleSearchAvailable: !!(
          process.env.GOOGLE_SEARCH_API_KEY &&
          process.env.GOOGLE_SEARCH_ENGINE_ID
        ),
        environment: process.env.NODE_ENV || "development",
      },
    };
  }

  /**
   * Reset tool usage statistics
   */
  resetStats() {
    this.toolUsageStats.clear();
    console.log("📊 MCP tool usage statistics reset");
  }

  /**
   * Get detailed tool information for debugging
   * @returns {Object} - Detailed tool information
   */
  getDetailedToolInfo() {
    if (!this.isEnabled) {
      return { error: "MCP integration not available" };
    }

    const toolInfo = this.orchestrator.getToolInfo();
    const usageStats = this.getToolUsageStats();

    return {
      integration: {
        enabled: this.isEnabled,
        orchestratorInitialized: !!this.orchestrator,
        toolsCount: this.orchestrator.getAvailableTools().length,
      },
      tools: toolInfo,
      usage: usageStats,
      configuration: {
        googleSearchApiKey: process.env.GOOGLE_SEARCH_API_KEY
          ? "Set"
          : "Not set",
        googleSearchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID
          ? "Set"
          : "Not set",
        nodeEnv: process.env.NODE_ENV || "development",
      },
    };
  }

  // ==================== TOOL MANAGEMENT METHODS ====================

  /**
   * Enable a specific MCP tool
   * @param {string} toolName - Name of the tool to enable
   * @returns {Promise<boolean>} - Success status
   */
  async enableTool(toolName) {
    try {
      const success = await this.toolConfigManager.enableTool(toolName);
      if (success) {
        console.log(`✅ MCP Integration: Tool '${toolName}' enabled`);
        // Reinitialize orchestrator with updated tool configuration
        await this.refreshOrchestrator();
      }
      return success;
    } catch (error) {
      console.error(
        `❌ MCP Integration: Failed to enable tool '${toolName}':`,
        error.message
      );
      return false;
    }
  }

  /**
   * Disable a specific MCP tool
   * @param {string} toolName - Name of the tool to disable
   * @returns {Promise<boolean>} - Success status
   */
  async disableTool(toolName) {
    try {
      const success = await this.toolConfigManager.disableTool(toolName);
      if (success) {
        console.log(`✅ MCP Integration: Tool '${toolName}' disabled`);
        // Reinitialize orchestrator with updated tool configuration
        await this.refreshOrchestrator();
      }
      return success;
    } catch (error) {
      console.error(
        `❌ MCP Integration: Failed to disable tool '${toolName}':`,
        error.message
      );
      return false;
    }
  }

  /**
   * Toggle a tool's enabled state
   * @param {string} toolName - Name of the tool to toggle
   * @returns {Promise<boolean>} - New enabled state
   */
  async toggleTool(toolName) {
    try {
      const newState = await this.toolConfigManager.toggleTool(toolName);
      console.log(
        `✅ MCP Integration: Tool '${toolName}' ${
          newState ? "enabled" : "disabled"
        }`
      );
      // Reinitialize orchestrator with updated tool configuration
      await this.refreshOrchestrator();
      return newState;
    } catch (error) {
      console.error(
        `❌ MCP Integration: Failed to toggle tool '${toolName}':`,
        error.message
      );
      return false;
    }
  }

  /**
   * Check if a tool is enabled
   * @param {string} toolName - Name of the tool
   * @returns {boolean} - Whether the tool is enabled
   */
  isToolEnabled(toolName) {
    return this.toolConfigManager.isToolEnabled(toolName);
  }

  /**
   * Get all enabled tools
   * @returns {Array} - List of enabled tool names
   */
  getEnabledTools() {
    return this.toolConfigManager.getEnabledTools();
  }

  /**
   * Get all disabled tools
   * @returns {Array} - List of disabled tool names
   */
  getDisabledTools() {
    return this.toolConfigManager.getDisabledTools();
  }

  /**
   * Get tool configuration
   * @param {string} toolName - Name of the tool
   * @returns {Object|null} - Tool configuration or null
   */
  getToolConfig(toolName) {
    return this.toolConfigManager.getToolConfig(toolName);
  }

  /**
   * Get all tool configurations
   * @returns {Object} - All tool configurations
   */
  getAllToolConfigs() {
    return this.toolConfigManager.getAllToolConfigs();
  }

  /**
   * Get tool status summary
   * @returns {Object} - Tool status information
   */
  getToolStatusSummary() {
    return this.toolConfigManager.getToolStatusSummary();
  }

  /**
   * Reset all tools to default state
   * @returns {Promise<boolean>} - Success status
   */
  async resetToolConfig() {
    try {
      const success = await this.toolConfigManager.resetToDefaults();
      if (success) {
        console.log("🔄 MCP Integration: Tool configuration reset to defaults");
        // Reinitialize orchestrator with default configuration
        await this.refreshOrchestrator();
      }
      return success;
    } catch (error) {
      console.error(
        "❌ MCP Integration: Failed to reset tool configuration:",
        error.message
      );
      return false;
    }
  }

  /**
   * Refresh the orchestrator with current tool configuration
   * @private
   */
  async refreshOrchestrator() {
    try {
      // Reinitialize orchestrator with updated tool configuration
      this.orchestrator = new AgentOrchestrator();
      this.isEnabled = this.checkMCPAvailability();
      console.log(
        "🔄 MCP Integration: Orchestrator refreshed with current tool configuration"
      );
    } catch (error) {
      console.error(
        "❌ MCP Integration: Failed to refresh orchestrator:",
        error.message
      );
    }
  }

  /**
   * Get comprehensive tool management information
   * @returns {Object} - Complete tool management status
   */
  getToolManagementInfo() {
    const statusSummary = this.getToolStatusSummary();
    const usageStats = this.getToolUsageStats();
    const configs = this.getAllToolConfigs();
    const aiStats = this.orchestrator.aiToolSelection.getStats();

    return {
      status: statusSummary,
      usage: usageStats,
      configurations: configs,
      integrationEnabled: this.isEnabled,
      configFile: this.toolConfigManager.getConfigFilePath(),
      aiSelection: aiStats,
    };
  }
}

export default MCPIntegrationService;
