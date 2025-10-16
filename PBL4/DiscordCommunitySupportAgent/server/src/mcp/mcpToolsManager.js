import FreeWebSearchTool from './tools/braveWebSearch.js';
import PermissionCalculatorTool from './tools/permissionCalculator.js';
import BotTokenValidatorTool from './tools/botTokenValidator.js';
import WebhookTesterTool from './tools/webhookTester.js';
import DiscordStatusCheckerTool from './tools/discordStatusChecker.js';
import RoleHierarchyCheckerTool from './tools/roleHierarchyChecker.js';

/**
 * MCP Tools Manager
 * Manages and coordinates all MCP tools for the Discord Community Support Agent
 */
export class MCPToolsManager {
  constructor() {
    this.tools = new Map();
    this.initializeTools();
  }

  /**
   * Initialize all MCP tools
   */
  initializeTools() {
    try {
      // Initialize Free Web Search (DuckDuckGo alternative)
      const freeWebSearch = new FreeWebSearchTool();
      this.tools.set('free_web_search', freeWebSearch);

      // Initialize Permission Calculator
      const permissionCalc = new PermissionCalculatorTool();
      this.tools.set('discord_permission_calculator', permissionCalc);

      // Initialize Bot Token Validator
      const tokenValidator = new BotTokenValidatorTool();
      this.tools.set('discord_bot_token_validator', tokenValidator);

      // Initialize Webhook Tester
      const webhookTester = new WebhookTesterTool();
      this.tools.set('discord_webhook_tester', webhookTester);

      // Initialize Discord Status Checker
      const statusChecker = new DiscordStatusCheckerTool();
      this.tools.set('discord_status_checker', statusChecker);

      // Initialize Role Hierarchy Checker
      const roleHierarchyChecker = new RoleHierarchyCheckerTool();
      this.tools.set('discord_role_hierarchy_checker', roleHierarchyChecker);

      console.log('✅ MCP Tools initialized successfully');
      console.log(`📋 Available tools: ${Array.from(this.tools.keys()).join(', ')}`);
    } catch (error) {
      console.error('❌ Failed to initialize MCP tools:', error.message);
      throw error;
    }
  }

  /**
   * Execute a tool with given parameters
   * @param {string} toolName - Name of the tool to execute
   * @param {Object} parameters - Tool parameters
   * @returns {Promise<Object>} Tool execution result
   */
  async executeTool(toolName, parameters) {
    try {
      const tool = this.tools.get(toolName);
      if (!tool) {
        return {
          success: false,
          error: `Tool '${toolName}' not found`,
          availableTools: Array.from(this.tools.keys())
        };
      }

      console.log(`🔧 Executing MCP tool: ${toolName}`);
      const result = await tool.execute(parameters);
      
      return {
        success: true,
        toolName,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Tool execution failed for ${toolName}:`, error.message);
      return {
        success: false,
        toolName,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute multiple tools in sequence
   * @param {Array} toolRequests - Array of tool execution requests
   * @returns {Promise<Array>} Array of tool execution results
   */
  async executeMultipleTools(toolRequests) {
    const results = [];
    
    for (const request of toolRequests) {
      const result = await this.executeTool(request.toolName, request.parameters);
      results.push(result);
    }

    return results;
  }

  /**
   * Get available tools metadata
   * @returns {Array} Array of tool metadata
   */
  getAvailableTools() {
    return Array.from(this.tools.values()).map(tool => tool.getMetadata());
  }

  /**
   * Check if a tool exists
   * @param {string} toolName - Tool name to check
   * @returns {boolean} True if tool exists
   */
  hasTool(toolName) {
    return this.tools.has(toolName);
  }

  /**
   * Get tool by name
   * @param {string} toolName - Tool name
   * @returns {Object|null} Tool instance or null
   */
  getTool(toolName) {
    return this.tools.get(toolName) || null;
  }

  /**
   * Analyze query and suggest appropriate tools
   * @param {string} query - User query
   * @returns {Array} Suggested tools
   */
  suggestToolsForQuery(query) {
    const suggestions = [];
    const queryLower = query.toLowerCase();

    // Web search suggestions
    if (this.shouldUseWebSearch(queryLower)) {
      suggestions.push({
        tool: 'free_web_search',
        reason: 'Query requires real-time information',
        confidence: this.calculateWebSearchConfidence(queryLower)
      });
    }

    // Permission calculator suggestions
    if (this.shouldUsePermissionCalculator(queryLower)) {
      suggestions.push({
        tool: 'discord_permission_calculator',
        reason: 'Query involves Discord permissions',
        confidence: this.calculatePermissionConfidence(queryLower)
      });
    }

    // Token validator suggestions
    if (this.shouldUseTokenValidator(queryLower)) {
      suggestions.push({
        tool: 'discord_bot_token_validator',
        reason: 'Query involves bot token validation',
        confidence: this.calculateTokenValidatorConfidence(queryLower)
      });
    }

    // Webhook tester suggestions
    if (this.shouldUseWebhookTester(queryLower)) {
      suggestions.push({
        tool: 'discord_webhook_tester',
        reason: 'Query involves webhook testing',
        confidence: this.calculateWebhookTesterConfidence(queryLower)
      });
    }

    // Status checker suggestions
    if (this.shouldUseStatusChecker(queryLower)) {
      suggestions.push({
        tool: 'discord_status_checker',
        reason: 'Query involves Discord status checking',
        confidence: this.calculateStatusCheckerConfidence(queryLower)
      });
    }

    // Role hierarchy checker suggestions
    if (this.shouldUseRoleHierarchyChecker(queryLower)) {
      suggestions.push({
        tool: 'discord_role_hierarchy_checker',
        reason: 'Query involves role hierarchy validation',
        confidence: this.calculateRoleHierarchyCheckerConfidence(queryLower)
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Determine if query should use web search
   * @param {string} queryLower - Lowercase query
   * @returns {boolean} True if should use web search
   */
  shouldUseWebSearch(queryLower) {
    const webSearchKeywords = [
      'status', 'down', 'outage', 'update', 'new', 'latest', 'recent',
      'current', 'today', 'now', 'happening', 'news', 'announcement'
    ];

    return webSearchKeywords.some(keyword => queryLower.includes(keyword));
  }

  /**
   * Determine if query should use permission calculator
   * @param {string} queryLower - Lowercase query
   * @returns {boolean} True if should use permission calculator
   */
  shouldUsePermissionCalculator(queryLower) {
    const permissionKeywords = [
      'permission', 'role', 'bitfield', 'calculate', 'admin', 'moderator',
      'kick', 'ban', 'manage', 'channel', 'voice', 'text'
    ];

    return permissionKeywords.some(keyword => queryLower.includes(keyword));
  }

  /**
   * Determine if query should use token validator
   * @param {string} queryLower - Lowercase query
   * @returns {boolean} True if should use token validator
   */
  shouldUseTokenValidator(queryLower) {
    const tokenKeywords = [
      'token', 'bot token', 'validate', 'invalid', 'expired', 'authentication',
      'api key', 'credentials', 'login', 'auth'
    ];

    return tokenKeywords.some(keyword => queryLower.includes(keyword));
  }

  /**
   * Calculate web search confidence
   * @param {string} queryLower - Lowercase query
   * @returns {number} Confidence score (0-1)
   */
  calculateWebSearchConfidence(queryLower) {
    const highConfidenceKeywords = ['status', 'down', 'outage', 'update'];
    const mediumConfidenceKeywords = ['new', 'latest', 'recent', 'current'];

    if (highConfidenceKeywords.some(keyword => queryLower.includes(keyword))) {
      return 0.9;
    }
    if (mediumConfidenceKeywords.some(keyword => queryLower.includes(keyword))) {
      return 0.7;
    }
    return 0.5;
  }

  /**
   * Calculate permission calculator confidence
   * @param {string} queryLower - Lowercase query
   * @returns {number} Confidence score (0-1)
   */
  calculatePermissionConfidence(queryLower) {
    const highConfidenceKeywords = ['permission', 'bitfield', 'calculate'];
    const mediumConfidenceKeywords = ['role', 'admin', 'moderator'];

    if (highConfidenceKeywords.some(keyword => queryLower.includes(keyword))) {
      return 0.9;
    }
    if (mediumConfidenceKeywords.some(keyword => queryLower.includes(keyword))) {
      return 0.7;
    }
    return 0.5;
  }

  /**
   * Calculate token validator confidence
   * @param {string} queryLower - Lowercase query
   * @returns {number} Confidence score (0-1)
   */
  calculateTokenValidatorConfidence(queryLower) {
    const highConfidenceKeywords = ['token', 'validate', 'invalid', 'expired'];
    const mediumConfidenceKeywords = ['bot token', 'authentication', 'auth'];

    if (highConfidenceKeywords.some(keyword => queryLower.includes(keyword))) {
      return 0.9;
    }
    if (mediumConfidenceKeywords.some(keyword => queryLower.includes(keyword))) {
      return 0.7;
    }
    return 0.5;
  }

  /**
   * Determine if query should use webhook tester
   * @param {string} queryLower - Lowercase query
   * @returns {boolean} True if should use webhook tester
   */
  shouldUseWebhookTester(queryLower) {
    const webhookKeywords = [
      'webhook', 'test webhook', 'webhook url', 'webhook test',
      'discord webhook', 'webhook validation'
    ];

    return webhookKeywords.some(keyword => queryLower.includes(keyword));
  }

  /**
   * Calculate webhook tester confidence
   * @param {string} queryLower - Lowercase query
   * @returns {number} Confidence score (0-1)
   */
  calculateWebhookTesterConfidence(queryLower) {
    const highConfidenceKeywords = ['webhook', 'test webhook', 'webhook url'];
    const mediumConfidenceKeywords = ['webhook test', 'discord webhook'];

    if (highConfidenceKeywords.some(keyword => queryLower.includes(keyword))) {
      return 0.9;
    }
    if (mediumConfidenceKeywords.some(keyword => queryLower.includes(keyword))) {
      return 0.7;
    }
    return 0.5;
  }

  /**
   * Determine if query should use status checker
   * @param {string} queryLower - Lowercase query
   * @returns {boolean} True if should use status checker
   */
  shouldUseStatusChecker(queryLower) {
    const statusKeywords = [
      'discord status', 'discord down', 'discord outage', 'discord issues',
      'discord problems', 'service status', 'api status'
    ];

    return statusKeywords.some(keyword => queryLower.includes(keyword));
  }

  /**
   * Calculate status checker confidence
   * @param {string} queryLower - Lowercase query
   * @returns {number} Confidence score (0-1)
   */
  calculateStatusCheckerConfidence(queryLower) {
    const highConfidenceKeywords = ['discord status', 'discord down', 'discord outage'];
    const mediumConfidenceKeywords = ['discord issues', 'service status'];

    if (highConfidenceKeywords.some(keyword => queryLower.includes(keyword))) {
      return 0.9;
    }
    if (mediumConfidenceKeywords.some(keyword => queryLower.includes(keyword))) {
      return 0.7;
    }
    return 0.5;
  }

  /**
   * Determine if query should use role hierarchy checker
   * @param {string} queryLower - Lowercase query
   * @returns {boolean} True if should use role hierarchy checker
   */
  shouldUseRoleHierarchyChecker(queryLower) {
    const hierarchyKeywords = [
      'role hierarchy', 'role order', 'role position', 'role management',
      'role validation', 'role conflicts', 'role inheritance'
    ];

    return hierarchyKeywords.some(keyword => queryLower.includes(keyword));
  }

  /**
   * Calculate role hierarchy checker confidence
   * @param {string} queryLower - Lowercase query
   * @returns {number} Confidence score (0-1)
   */
  calculateRoleHierarchyCheckerConfidence(queryLower) {
    const highConfidenceKeywords = ['role hierarchy', 'role order', 'role position'];
    const mediumConfidenceKeywords = ['role management', 'role validation'];

    if (highConfidenceKeywords.some(keyword => queryLower.includes(keyword))) {
      return 0.9;
    }
    if (mediumConfidenceKeywords.some(keyword => queryLower.includes(keyword))) {
      return 0.7;
    }
    return 0.5;
  }

  /**
   * Get tool status
   * @returns {Object} Tool status information
   */
  getStatus() {
    return {
      initialized: true,
      toolCount: this.tools.size,
      tools: Array.from(this.tools.keys()),
      timestamp: new Date().toISOString()
    };
  }
}

export default MCPToolsManager;
