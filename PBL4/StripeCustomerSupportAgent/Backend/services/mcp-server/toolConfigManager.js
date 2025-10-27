import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Tool Configuration Manager
 * Manages individual MCP tool enable/disable settings
 */
class ToolConfigManager {
  constructor() {
    this.configFile = path.join(__dirname, "../../config/mcp-tools.json");
    this.defaultConfig = {
      tools: {
        calculator: {
          enabled: true,
          name: "Calculator Tool",
          description: "Mathematical calculations and Stripe fee computations",
          dependencies: ["mathjs"],
          apiKeys: [],
        },
        status_checker: {
          enabled: true,
          name: "Status Checker Tool",
          description: "Real-time Stripe API status monitoring",
          dependencies: ["axios"],
          apiKeys: ["STRIPE_SECRET_KEY"],
        },
        web_search: {
          enabled: true,
          name: "Web Search Tool",
          description: "Google Custom Search for current information",
          dependencies: ["axios"],
          apiKeys: ["GOOGLE_SEARCH_API_KEY", "GOOGLE_SEARCH_ENGINE_ID"],
        },
        code_validator: {
          enabled: true,
          name: "Code Validator Tool",
          description: "Code syntax validation and API endpoint verification",
          dependencies: [],
          apiKeys: [],
        },
        datetime: {
          enabled: true,
          name: "DateTime Tool",
          description: "Date/time operations and business hours",
          dependencies: ["date-fns"],
          apiKeys: [],
        },
        currency_converter: {
          enabled: true,
          name: "Currency Converter Tool",
          description: "Convert currencies with real-time exchange rates",
          dependencies: ["axios"],
          apiKeys: [],
        },
      },
      lastUpdated: new Date().toISOString(),
      version: "1.0.0",
    };
    this.config = null;
  }

  /**
   * Initialize the configuration manager
   */
  async initialize() {
    try {
      await this.loadConfig();
      console.log("✅ Tool Config Manager: Initialized");
    } catch (error) {
      console.error(
        "❌ Tool Config Manager: Failed to initialize:",
        error.message
      );
      await this.createDefaultConfig();
    }
  }

  /**
   * Load configuration from file
   */
  async loadConfig() {
    try {
      const configData = await fs.readFile(this.configFile, "utf8");
      this.config = JSON.parse(configData);
      console.log("📋 Tool Config Manager: Configuration loaded");
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log(
          "📋 Tool Config Manager: No config file found, creating default"
        );
        await this.createDefaultConfig();
      } else {
        throw error;
      }
    }
  }

  /**
   * Create default configuration file
   */
  async createDefaultConfig() {
    try {
      const configDir = path.dirname(this.configFile);
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        this.configFile,
        JSON.stringify(this.defaultConfig, null, 2)
      );
      this.config = { ...this.defaultConfig };
      console.log("✅ Tool Config Manager: Default configuration created");
    } catch (error) {
      console.error(
        "❌ Tool Config Manager: Failed to create default config:",
        error.message
      );
      throw error;
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig() {
    try {
      this.config.lastUpdated = new Date().toISOString();
      await fs.writeFile(this.configFile, JSON.stringify(this.config, null, 2));
      console.log("💾 Tool Config Manager: Configuration saved");
    } catch (error) {
      console.error(
        "❌ Tool Config Manager: Failed to save config:",
        error.message
      );
      throw error;
    }
  }

  /**
   * Enable a specific tool
   * @param {string} toolName - Name of the tool to enable
   * @returns {boolean} - Success status
   */
  async enableTool(toolName) {
    try {
      if (!this.config.tools[toolName]) {
        throw new Error(`Tool '${toolName}' not found in configuration`);
      }

      // Check if tool dependencies are available
      const tool = this.config.tools[toolName];
      const missingDeps = await this.checkDependencies(tool);
      const missingKeys = await this.checkApiKeys(tool);

      if (missingDeps.length > 0) {
        console.warn(
          `⚠️ Tool '${toolName}': Missing dependencies: ${missingDeps.join(
            ", "
          )}`
        );
      }

      if (missingKeys.length > 0) {
        console.warn(
          `⚠️ Tool '${toolName}': Missing API keys: ${missingKeys.join(", ")}`
        );
      }

      this.config.tools[toolName].enabled = true;
      await this.saveConfig();

      console.log(`✅ Tool '${toolName}' enabled successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to enable tool '${toolName}':`, error.message);
      return false;
    }
  }

  /**
   * Disable a specific tool
   * @param {string} toolName - Name of the tool to disable
   * @returns {boolean} - Success status
   */
  async disableTool(toolName) {
    try {
      if (!this.config.tools[toolName]) {
        throw new Error(`Tool '${toolName}' not found in configuration`);
      }

      this.config.tools[toolName].enabled = false;
      await this.saveConfig();

      console.log(`✅ Tool '${toolName}' disabled successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to disable tool '${toolName}':`, error.message);
      return false;
    }
  }

  /**
   * Toggle a tool's enabled state
   * @param {string} toolName - Name of the tool to toggle
   * @returns {boolean} - New enabled state
   */
  async toggleTool(toolName) {
    try {
      if (!this.config.tools[toolName]) {
        throw new Error(`Tool '${toolName}' not found in configuration`);
      }

      const currentState = this.config.tools[toolName].enabled;
      const newState = !currentState;

      if (newState) {
        await this.enableTool(toolName);
      } else {
        await this.disableTool(toolName);
      }

      return newState;
    } catch (error) {
      console.error(`❌ Failed to toggle tool '${toolName}':`, error.message);
      return false;
    }
  }

  /**
   * Get the enabled state of a tool
   * @param {string} toolName - Name of the tool
   * @returns {boolean} - Whether the tool is enabled
   */
  isToolEnabled(toolName) {
    return this.config?.tools?.[toolName]?.enabled ?? false;
  }

  /**
   * Get all enabled tools
   * @returns {Array} - List of enabled tool names
   */
  getEnabledTools() {
    if (!this.config?.tools) return [];

    return Object.keys(this.config.tools).filter(
      (toolName) => this.config.tools[toolName].enabled
    );
  }

  /**
   * Get all disabled tools
   * @returns {Array} - List of disabled tool names
   */
  getDisabledTools() {
    if (!this.config?.tools) return [];

    return Object.keys(this.config.tools).filter(
      (toolName) => !this.config.tools[toolName].enabled
    );
  }

  /**
   * Get tool configuration
   * @param {string} toolName - Name of the tool
   * @returns {Object|null} - Tool configuration or null
   */
  getToolConfig(toolName) {
    return this.config?.tools?.[toolName] || null;
  }

  /**
   * Get all tool configurations
   * @returns {Object} - All tool configurations
   */
  getAllToolConfigs() {
    return this.config?.tools || {};
  }

  /**
   * Check if tool dependencies are available
   * @param {Object} tool - Tool configuration
   * @returns {Array} - Missing dependencies
   */
  async checkDependencies(tool) {
    const missing = [];

    for (const dep of tool.dependencies || []) {
      try {
        await import(dep);
      } catch (error) {
        missing.push(dep);
      }
    }

    return missing;
  }

  /**
   * Check if required API keys are available
   * @param {Object} tool - Tool configuration
   * @returns {Array} - Missing API keys
   */
  async checkApiKeys(tool) {
    const missing = [];

    for (const key of tool.apiKeys || []) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }

    return missing;
  }

  /**
   * Get tool status summary
   * @returns {Object} - Tool status information
   */
  getToolStatusSummary() {
    if (!this.config?.tools) {
      return { enabled: 0, disabled: 0, total: 0, tools: {}, details: {} };
    }

    const tools = Object.keys(this.config.tools);
    const enabled = tools.filter((name) => this.config.tools[name].enabled);
    const disabled = tools.filter((name) => !this.config.tools[name].enabled);

    // Create details object with tool information
    const details = {};
    tools.forEach((toolName) => {
      const tool = this.config.tools[toolName];
      details[toolName] = {
        enabled: tool.enabled,
        description: tool.description || `${toolName} tool`,
        dependencies: tool.dependencies || [],
        apiKeys: tool.apiKeys || [],
      };
    });

    return {
      enabled: enabled.length,
      disabled: disabled.length,
      total: tools.length,
      tools: {
        enabled: enabled,
        disabled: disabled,
      },
      details: details,
    };
  }

  /**
   * Reset all tools to default state
   * @returns {boolean} - Success status
   */
  async resetToDefaults() {
    try {
      this.config = { ...this.defaultConfig };
      await this.saveConfig();
      console.log("🔄 Tool Config Manager: Reset to default configuration");
      return true;
    } catch (error) {
      console.error(
        "❌ Tool Config Manager: Failed to reset config:",
        error.message
      );
      return false;
    }
  }

  /**
   * Get configuration file path
   * @returns {string} - Path to configuration file
   */
  getConfigFilePath() {
    return this.configFile;
  }
}

export default ToolConfigManager;
