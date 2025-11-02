const MCPToolsService = require("./serviceAdapter.cjs");

async function testMCPTools() {
  console.log("🧪 Testing MCP Tools Service\n");

  const mcpTools = new MCPToolsService();

  // Test currency conversion queries
  const currencyQueries = [
    "Convert 100 USD to EUR",
    "What's the exchange rate from GBP to USD?",
    "How much is 50 EUR in Japanese Yen?",
    "Convert 1000 USD to Indian Rupees",
    "What's 75 GBP worth in Canadian Dollars?",
  ];

  console.log("💱 Testing Currency Conversion:");
  for (const query of currencyQueries) {
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

  // Test web search queries
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

  // Test timeline estimation queries
  const timelineQueries = [
    "How long will my $500 payment be held?",
    "When will funds be available for a $50 transaction?",
    "Timeline for $2000 payment hold period",
    "How long does it take for new account funds to be released?",
    "When will my $100 refund be available?",
  ];

  console.log("\n\n⏰ Testing Transaction Timeline:");
  for (const query of timelineQueries) {
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

  // Test API status checker queries
  const statusQueries = [
    "Is PayPal down?",
    "PayPal status check",
    "Is PayPal working today?",
    "PayPal outage status",
    "Are PayPal services available?",
  ];

  console.log("\n\n📊 Testing API Status Checker:");
  for (const query of statusQueries) {
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

  // Test fee calculator queries
  const feeQueries = [
    "What are PayPal fees for $100?",
    "Calculate PayPal fees for $500 transaction",
    "PayPal merchant fees for $1000",
    "How much does PayPal charge for $50?",
    "PayPal fee calculation for $250",
  ];

  console.log("\n\n🧮 Testing Fee Calculator:");
  for (const query of feeQueries) {
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

  // Test regular queries (should not trigger MCP tools)
  const regularQueries = [
    "How do I request a refund?",
    "How to dispute a transaction?",
    "How to change my password?",
    "How to add a bank account?",
  ];

  console.log("\n\n📝 Testing Regular Queries (should not trigger MCP):");
  for (const query of regularQueries) {
    console.log(`\nQuery: "${query}"`);
    try {
      const result = await mcpTools.processQuery(query);
      if (result) {
        console.log(`✅ MCP tool triggered: ${result.type}`);
      } else {
        console.log("✅ No MCP tool triggered (as expected)");
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log("\n\n✅ MCP Tools testing completed!");
}

// Run the test
testMCPTools().catch(console.error);
