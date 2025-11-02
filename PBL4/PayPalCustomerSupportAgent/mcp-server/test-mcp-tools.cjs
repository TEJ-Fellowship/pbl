const MCPToolsService = require("./serviceAdapter.cjs");

async function testMCPTools() {
  console.log("🧪 Testing MCP Tools Service\n");

  const mcpTools = new MCPToolsService();

  const webSearchQueries = [
    "Recent PayPal outages",
    "Current PayPal status",
    "Latest PayPal news",
    "PayPal down today",
  ];

  console.log("\n\n🌐 Testing Web Search:");
  for (const query of webSearchQueries) {
    console.log(`\nQuery: "${query}"`);
    try {
      const result = await mcpTools.processQuery(query);
      if (result) {
        console.log(`✅ Result: ${result.message}`);
      } else {
        console.log("❌ No MCP tool triggered");
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log("\n\n✅ MCP Tools web-search test completed!");
}

testMCPTools().catch(console.error);
