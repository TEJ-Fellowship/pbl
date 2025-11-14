#!/usr/bin/env node

import MCPIntegrationService from "../services/mcpIntegrationService.js";
import readline from "readline";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * MCP Tool Manager CLI
 * Interactive command-line interface for managing MCP tools
 */
class ToolManager {
  constructor() {
    this.mcpService = new MCPIntegrationService();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Start the interactive tool manager
   */
  async start() {
    console.log("🔧 MCP Tool Manager");
    console.log("==================");
    console.log("Interactive tool for managing MCP tools");
    console.log("");

    // Wait for MCP service to initialize
    await this.waitForInitialization();

    // Add a small delay to ensure readline is ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.showMainMenu();
  }

  /**
   * Wait for MCP service to initialize
   */
  async waitForInitialization() {
    console.log("🔄 Initializing MCP Integration Service...");

    // Wait a bit for async initialization
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("✅ MCP Integration Service initialized");
  }

  /**
   * Show the main menu
   */
  showMainMenu() {
    console.log("\n📋 Main Menu:");
    console.log("1. List all tools and their status");
    console.log("2. Enable a tool");
    console.log("3. Disable a tool");
    console.log("4. Toggle a tool");
    console.log("5. Show tool details");
    console.log("6. Reset to defaults");
    console.log("7. Show usage statistics");
    console.log("8. Exit");
    console.log("");

    this.rl.question("Select an option (1-8): ", (answer) => {
      this.handleMainMenuChoice(answer.trim());
    });
  }

  /**
   * Handle main menu choice
   * @param {string} choice - User's choice
   */
  async handleMainMenuChoice(choice) {
    switch (choice) {
      case "1":
        await this.listTools();
        break;
      case "2":
        await this.enableTool();
        break;
      case "3":
        await this.disableTool();
        break;
      case "4":
        await this.toggleTool();
        break;
      case "5":
        await this.showToolDetails();
        break;
      case "6":
        await this.resetToDefaults();
        break;
      case "7":
        await this.showUsageStats();
        break;
      case "8":
        this.exit();
        break;
      default:
        console.log("❌ Invalid option. Please try again.");
        this.showMainMenu();
    }
  }

  /**
   * List all tools and their status
   */
  async listTools() {
    console.log("\n🛠️ MCP Tools Status:");
    console.log("=====================");

    const statusSummary = this.mcpService.getToolStatusSummary();
    const allConfigs = this.mcpService.getAllToolConfigs();

    console.log(`📊 Total Tools: ${statusSummary.total}`);
    console.log(`✅ Enabled: ${statusSummary.enabled}`);
    console.log(`❌ Disabled: ${statusSummary.disabled}`);
    console.log("");

    // Show each tool's status
    Object.keys(allConfigs).forEach((toolName) => {
      const config = allConfigs[toolName];
      const status = config.enabled ? "✅ ENABLED" : "❌ DISABLED";
      console.log(`${status} ${toolName}: ${config.description}`);
    });

    console.log("");
    this.showMainMenu();
  }

  /**
   * Enable a tool
   */
  async enableTool() {
    const availableTools = Object.keys(this.mcpService.getAllToolConfigs());

    console.log("\n🔧 Available Tools:");
    availableTools.forEach((tool, index) => {
      const status = this.mcpService.isToolEnabled(tool) ? "✅" : "❌";
      console.log(`${index + 1}. ${status} ${tool}`);
    });

    this.rl.question("\nEnter tool name to enable: ", async (toolName) => {
      if (!availableTools.includes(toolName)) {
        console.log(`❌ Tool '${toolName}' not found.`);
        this.showMainMenu();
        return;
      }

      if (this.mcpService.isToolEnabled(toolName)) {
        console.log(`⚠️ Tool '${toolName}' is already enabled.`);
        this.showMainMenu();
        return;
      }

      console.log(`🔄 Enabling tool '${toolName}'...`);
      const success = await this.mcpService.enableTool(toolName);

      if (success) {
        console.log(`✅ Tool '${toolName}' enabled successfully!`);
      } else {
        console.log(`❌ Failed to enable tool '${toolName}'.`);
      }

      this.showMainMenu();
    });
  }

  /**
   * Disable a tool
   */
  async disableTool() {
    const availableTools = Object.keys(this.mcpService.getAllToolConfigs());
    const enabledTools = this.mcpService.getEnabledTools();

    if (enabledTools.length === 0) {
      console.log("⚠️ No tools are currently enabled.");
      this.showMainMenu();
      return;
    }

    console.log("\n🔧 Enabled Tools:");
    enabledTools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool}`);
    });

    this.rl.question("\nEnter tool name to disable: ", async (toolName) => {
      if (!availableTools.includes(toolName)) {
        console.log(`❌ Tool '${toolName}' not found.`);
        this.showMainMenu();
        return;
      }

      if (!this.mcpService.isToolEnabled(toolName)) {
        console.log(`⚠️ Tool '${toolName}' is already disabled.`);
        this.showMainMenu();
        return;
      }

      console.log(`🔄 Disabling tool '${toolName}'...`);
      const success = await this.mcpService.disableTool(toolName);

      if (success) {
        console.log(`✅ Tool '${toolName}' disabled successfully!`);
      } else {
        console.log(`❌ Failed to disable tool '${toolName}'.`);
      }

      this.showMainMenu();
    });
  }

  /**
   * Toggle a tool
   */
  async toggleTool() {
    const availableTools = Object.keys(this.mcpService.getAllToolConfigs());

    console.log("\n🔧 Available Tools:");
    availableTools.forEach((tool, index) => {
      const status = this.mcpService.isToolEnabled(tool) ? "✅" : "❌";
      console.log(`${index + 1}. ${status} ${tool}`);
    });

    this.rl.question("\nEnter tool name to toggle: ", async (toolName) => {
      if (!availableTools.includes(toolName)) {
        console.log(`❌ Tool '${toolName}' not found.`);
        this.showMainMenu();
        return;
      }

      const currentState = this.mcpService.isToolEnabled(toolName);
      console.log(
        `🔄 Toggling tool '${toolName}' (currently ${
          currentState ? "enabled" : "disabled"
        })...`
      );

      const newState = await this.mcpService.toggleTool(toolName);

      if (newState !== null) {
        console.log(
          `✅ Tool '${toolName}' is now ${newState ? "enabled" : "disabled"}!`
        );
      } else {
        console.log(`❌ Failed to toggle tool '${toolName}'.`);
      }

      this.showMainMenu();
    });
  }

  /**
   * Show tool details
   */
  async showToolDetails() {
    const allConfigs = this.mcpService.getAllToolConfigs();
    const availableTools = Object.keys(allConfigs);

    console.log("\n🔧 Available Tools:");
    availableTools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool}`);
    });

    this.rl.question("\nEnter tool name for details: ", (toolName) => {
      if (!availableTools.includes(toolName)) {
        console.log(`❌ Tool '${toolName}' not found.`);
        this.showMainMenu();
        return;
      }

      const config = this.mcpService.getToolConfig(toolName);
      const isEnabled = this.mcpService.isToolEnabled(toolName);

      console.log(`\n📋 Tool Details: ${toolName}`);
      console.log("========================");
      console.log(`Name: ${config.name}`);
      console.log(`Description: ${config.description}`);
      console.log(`Status: ${isEnabled ? "✅ ENABLED" : "❌ DISABLED"}`);
      console.log(`Dependencies: ${config.dependencies.join(", ") || "None"}`);
      console.log(`Required API Keys: ${config.apiKeys.join(", ") || "None"}`);

      this.showMainMenu();
    });
  }

  /**
   * Reset to defaults
   */
  async resetToDefaults() {
    this.rl.question(
      "\n⚠️ Are you sure you want to reset all tools to default state? (y/N): ",
      async (answer) => {
        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
          console.log("🔄 Resetting all tools to default state...");
          const success = await this.mcpService.resetToolConfig();

          if (success) {
            console.log("✅ All tools reset to default state!");
          } else {
            console.log("❌ Failed to reset tools to default state.");
          }
        } else {
          console.log("❌ Reset cancelled.");
        }

        this.showMainMenu();
      }
    );
  }

  /**
   * Show usage statistics
   */
  async showUsageStats() {
    console.log("\n📊 Tool Usage Statistics:");
    console.log("=========================");

    const usageStats = this.mcpService.getToolUsageStats();
    const statusSummary = this.mcpService.getToolStatusSummary();
    await this.mcpService.ensureInitialized();
    const managementInfo = await this.mcpService.getToolManagementInfo();

    console.log(`🛠️ Total Tools: ${statusSummary.total}`);
    console.log(`✅ Enabled: ${statusSummary.enabled}`);
    console.log(`❌ Disabled: ${statusSummary.disabled}`);
    console.log("");

    if (Object.keys(usageStats).length === 0) {
      console.log("📈 No usage statistics available yet.");
    } else {
      console.log("📈 Usage Statistics:");
      Object.entries(usageStats).forEach(([tool, count]) => {
        console.log(`   ${tool}: ${count} times`);
      });
    }

    console.log("");
    console.log(`📁 Configuration File: ${managementInfo.configFile}`);
    console.log(
      `🔧 Integration Enabled: ${
        managementInfo.integrationEnabled ? "Yes" : "No"
      }`
    );

    this.showMainMenu();
  }

  /**
   * Exit the application
   */
  exit() {
    console.log("\n👋 Goodbye! Tool manager session ended.");
    this.rl.close();
    process.exit(0);
  }
}

// Run the tool manager if this file is executed directly
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.includes("toolManager.js")
) {
  const toolManager = new ToolManager();
  toolManager.start().catch(console.error);
}

export default ToolManager;
