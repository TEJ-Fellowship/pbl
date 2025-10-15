import MCPIntegrationService from "../services/mcpIntegrationService.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/config.js";

/**
 * Test script to demonstrate MCP integration with chat service
 */
class IntegratedChatTest {
  constructor() {
    this.mcpService = new MCPIntegrationService();
    this.geminiClient = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  }

  async runTest() {
    console.log("🧪 Testing Integrated Chat with MCP Tools");
    console.log("=".repeat(50));

    // Wait for MCP service to initialize
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const testQueries = [
      {
        query: "What's Stripe's fee for $1000?",
        description: "Calculator Tool Test",
        expectedTools: ["calculator"],
      },
      {
        query: "Is Stripe down right now?",
        description: "Status Checker Tool Test",
        expectedTools: ["status_checker"],
      },
      {
        query: "Validate this endpoint: /v1/charges",
        description: "Code Validator Tool Test",
        expectedTools: ["code_validator"],
      },
      {
        query: "What time is it now?",
        description: "DateTime Tool Test",
        expectedTools: ["datetime"],
      },
      {
        query: "Calculate fees for $5000 and check if Stripe is working",
        description: "Multi-Tool Test",
        expectedTools: ["calculator", "status_checker"],
      },
    ];

    for (const test of testQueries) {
      console.log(`\n🔍 Testing: ${test.description}`);
      console.log(`   Query: "${test.query}"`);

      try {
        // Simulate confidence score (0.5 for medium confidence)
        const confidence = 0.5;

        // Process with MCP
        const mcpResult = await this.mcpService.processQueryWithMCP(
          test.query,
          confidence
        );

        if (mcpResult.success) {
          console.log(
            `   ✅ MCP Success: ${mcpResult.toolsUsed?.length || 0} tools used`
          );
          console.log(
            `   🛠️ Tools: ${mcpResult.toolsUsed?.join(", ") || "None"}`
          );
          console.log(
            `   📊 Confidence: ${((mcpResult.confidence || 0) * 100).toFixed(
              1
            )}%`
          );

          if (mcpResult.enhancedResponse) {
            console.log(
              `   📝 Response Preview: ${mcpResult.enhancedResponse.substring(
                0,
                100
              )}...`
            );
          }
        } else {
          console.log(`   ❌ MCP Failed: ${mcpResult.message}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // Test MCP system status
    console.log(`\n🔧 MCP System Status:`);
    try {
      const mcpStatus = this.mcpService.getToolManagementInfo();
      console.log(
        `   Integration: ${
          mcpStatus.integration?.enabled ? "✅ Enabled" : "❌ Disabled"
        }`
      );
      console.log(`   Tools Available: ${mcpStatus.tools?.total || 0}`);
      console.log(`   Tools Enabled: ${mcpStatus.tools?.enabled || 0}`);
      console.log(`   Tools Disabled: ${mcpStatus.tools?.disabled || 0}`);
    } catch (error) {
      console.log(`   Status: ❌ Error getting status - ${error.message}`);
    }

    console.log(`\n🎉 Integrated Chat Test Completed!`);
  }
}

// Run the test
const test = new IntegratedChatTest();
test.runTest().catch(console.error);
