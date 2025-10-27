#!/usr/bin/env node

/**
 * MCP Integration Demo Script
 * Demonstrates the complete MCP tool integration for Stripe Intelligence Agent
 */

import MCPIntegrationService from "../services/mcpIntegrationService.js";
import AgentOrchestrator from "../services/mcp-server/agentOrchestrator.js";
import config from "../config/config.js";

class MCPDemo {
  constructor() {
    this.mcpService = new MCPIntegrationService();
    this.orchestrator = new AgentOrchestrator();
  }

  /**
   * Initialize the demo
   */
  async initialize() {
    // Wait for MCP service to initialize
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  /**
   * Run the complete MCP demo
   */
  async runDemo() {
    console.log("🚀 MCP Tool Integration Demo for Stripe Intelligence Agent");
    console.log("=".repeat(60));
    console.log();

    try {
      // Initialize first
      await this.initialize();

      // Step 1: Check system status
      await this.checkSystemStatus();

      // Step 2: Demonstrate individual tools
      await this.demonstrateIndividualTools();

      // Step 3: Demonstrate tool orchestration
      await this.demonstrateToolOrchestration();

      // Step 4: Demonstrate real-world scenarios
      await this.demonstrateRealWorldScenarios();

      // Step 5: Show performance metrics
      await this.showPerformanceMetrics();

      console.log("\n🎉 MCP Integration Demo Completed Successfully!");
      console.log("=".repeat(60));
    } catch (error) {
      console.error("❌ Demo failed:", error.message);
      process.exit(1);
    }
  }

  /**
   * Check system status and configuration
   */
  async checkSystemStatus() {
    console.log("🔍 Step 1: System Status Check");
    console.log("-".repeat(40));

    const status = this.mcpService.getIntegrationStatus();
    const toolStatusSummary = this.mcpService.getToolStatusSummary();
    const allConfigs = this.mcpService.getAllToolConfigs();

    console.log(
      `✅ MCP Integration: ${status.enabled ? "Enabled" : "Disabled"}`
    );
    console.log(`🛠️ Total Tools: ${toolStatusSummary.total}`);
    console.log(`✅ Enabled Tools: ${toolStatusSummary.enabled}`);
    console.log(`❌ Disabled Tools: ${toolStatusSummary.disabled}`);
    console.log(
      `📊 Tool Usage Stats: ${
        Object.keys(status.toolUsageStats).length
      } tools used`
    );

    if (status.enabled) {
      console.log(`\n🔧 Tool Status Details:`);
      Object.entries(allConfigs).forEach(([toolName, config]) => {
        const isEnabled = this.mcpService.isToolEnabled(toolName);
        const statusIcon = isEnabled ? "✅" : "❌";
        const statusText = isEnabled ? "ENABLED" : "DISABLED";
        console.log(
          `   ${statusIcon} ${toolName}: ${statusText} - ${config.description}`
        );
      });
    }

    console.log();
  }

  /**
   * Demonstrate individual MCP tools
   */
  async demonstrateIndividualTools() {
    console.log("🧪 Step 2: Individual Tool Demonstration");
    console.log("-".repeat(40));

    const testCases = [
      {
        name: "Calculator Tool",
        query: "What's Stripe's fee for $1000?",
        expectedTools: ["calculator"],
      },
      {
        name: "Status Checker Tool",
        query: "Is Stripe down right now?",
        expectedTools: ["status_checker"],
      },
      {
        name: "Code Validator Tool",
        query: "Validate this endpoint: /v1/charges",
        expectedTools: ["code_validator"],
      },
      {
        name: "DateTime Tool",
        query: "What time is it now?",
        expectedTools: ["datetime"],
      },
      {
        name: "Web Search Tool",
        query: "Latest Stripe API updates 2024",
        expectedTools: ["web_search"],
      },
    ];

    for (const testCase of testCases) {
      console.log(`\n🔍 Testing ${testCase.name}:`);
      console.log(`   Query: "${testCase.query}"`);

      try {
        const result = await this.mcpService.processQueryWithMCP(
          testCase.query,
          0.5
        );

        if (result.success) {
          console.log(`   ✅ Success: ${result.toolsUsed.length} tools used`);
          console.log(`   🛠️ Tools: ${result.toolsUsed.join(", ")}`);

          if (result.enhancedResponse) {
            console.log(
              `   📝 Response Preview: ${result.enhancedResponse.substring(
                0,
                100
              )}...`
            );
          }
        } else {
          console.log(`   ❌ Failed: ${result.message}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    console.log();
  }

  /**
   * Demonstrate tool orchestration
   */
  async demonstrateToolOrchestration() {
    console.log("🎯 Step 3: Tool Orchestration Demonstration");
    console.log("-".repeat(40));

    const orchestrationTests = [
      {
        name: "High Confidence Query",
        query: "How do I create a payment intent?",
        confidence: 0.8,
        expectedBehavior: "Should use minimal tools",
      },
      {
        name: "Medium Confidence Query",
        query: "What's Stripe's fee for $1000 and is it down?",
        confidence: 0.6,
        expectedBehavior: "Should use calculator and status checker",
      },
      {
        name: "Low Confidence Query",
        query: "Latest Stripe webhook changes",
        confidence: 0.3,
        expectedBehavior: "Should use web search and other relevant tools",
      },
    ];

    for (const test of orchestrationTests) {
      console.log(`\n🎯 ${test.name}:`);
      console.log(`   Query: "${test.query}"`);
      console.log(`   Confidence: ${test.confidence}`);
      console.log(`   Expected: ${test.expectedBehavior}`);

      try {
        // Test tool decision logic
        const toolNames = await this.orchestrator.decideToolUse(
          test.query,
          test.confidence
        );
        console.log(`   🛠️ Selected Tools: ${toolNames.join(", ")}`);

        // Execute tools
        const result = await this.mcpService.processQueryWithMCP(
          test.query,
          test.confidence
        );
        console.log(
          `   ✅ Execution: ${result.success ? "Success" : "Failed"}`
        );

        if (result.toolsUsed) {
          console.log(`   🔧 Tools Used: ${result.toolsUsed.join(", ")}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    console.log();
  }

  /**
   * Demonstrate real-world scenarios
   */
  async demonstrateRealWorldScenarios() {
    console.log("🌍 Step 4: Real-World Scenario Demonstration");
    console.log("-".repeat(40));

    const scenarios = [
      {
        name: "Developer Integration Help",
        query:
          "I'm getting a 400 error when creating a charge. What's wrong with my code: fetch('https://api.stripe.com/v1/charges', { method: 'POST' })",
        description: "Combines code validation with error troubleshooting",
      },
      {
        name: "Business Fee Calculation",
        query:
          "If I process $50,000 in payments this month, what will Stripe's fees be?",
        description: "Uses calculator tool for business planning",
      },
      {
        name: "Operational Status Check",
        query: "My webhooks aren't working. Is Stripe having issues?",
        description: "Combines status checking with technical support",
      },
      {
        name: "Recent Documentation Search",
        query: "What are the latest changes to Stripe's webhook API?",
        description: "Uses web search for up-to-date information",
      },
    ];

    for (const scenario of scenarios) {
      console.log(`\n🌍 ${scenario.name}:`);
      console.log(`   Description: ${scenario.description}`);
      console.log(`   Query: "${scenario.query}"`);

      try {
        const startTime = Date.now();
        const result = await this.mcpService.processQueryWithMCP(
          scenario.query,
          0.5
        );
        const endTime = Date.now();

        console.log(`   ⏱️ Processing Time: ${endTime - startTime}ms`);
        console.log(`   ✅ Success: ${result.success}`);

        if (result.toolsUsed && result.toolsUsed.length > 0) {
          console.log(`   🛠️ Tools Used: ${result.toolsUsed.join(", ")}`);
        }

        if (result.confidence) {
          console.log(
            `   📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`
          );
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    console.log();
  }

  /**
   * Show performance metrics
   */
  async showPerformanceMetrics() {
    console.log("📊 Step 5: Performance Metrics");
    console.log("-".repeat(40));

    // Get tool usage statistics
    const stats = this.mcpService.getToolUsageStats();
    console.log("🛠️ Tool Usage Statistics:");

    if (Object.keys(stats).length === 0) {
      console.log("   No tools used yet");
    } else {
      Object.entries(stats).forEach(([tool, count]) => {
        console.log(`   • ${tool}: ${count} times`);
      });
    }

    // Get detailed tool information
    const toolInfo = this.mcpService.getDetailedToolInfo();
    console.log("\n🔧 Tool Configuration:");
    console.log(`   • Integration Enabled: ${toolInfo.integration.enabled}`);
    console.log(`   • Tools Available: ${toolInfo.integration.toolsCount}`);
    console.log(
      `   • Google Search API Key: ${toolInfo.configuration.googleSearchApiKey}`
    );
    console.log(
      `   • Google Search Engine ID: ${toolInfo.configuration.googleSearchEngineId}`
    );
    console.log(`   • Environment: ${toolInfo.configuration.nodeEnv}`);

    console.log();
  }

  /**
   * Run a quick test to verify everything is working
   */
  async runQuickTest() {
    console.log("⚡ Quick Test");
    console.log("-".repeat(20));

    try {
      // Wait a bit more for full initialization
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const testResult = await this.mcpService.testMCPTools(
        "What's Stripe's fee for $100?"
      );

      if (testResult.success) {
        console.log("✅ MCP tools are working correctly");
        console.log(
          `🛠️ Available tools: ${testResult.toolsAvailable.join(", ")}`
        );
      } else {
        console.log("❌ MCP tools test failed");
        console.log(`Error: ${testResult.message}`);
      }
    } catch (error) {
      console.log("❌ Quick test failed:", error.message);
    }

    console.log();
  }
}

// Run the demo if this file is executed directly, or if invoked as mcpDemo.js
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.includes("mcpDemo.js")
) {
  const demo = new MCPDemo();

  // Run quick test first
  await demo.runQuickTest();

  // Run full demo
  await demo.runDemo();
}

export default MCPDemo;
