// Backend/test_web_search.js
// Test script for web search functionality

import WebSearchTool from "./src/webSearchTool.js";
import mcpWrapper from "./src/mcpWrapper.js";

async function testWebSearchTool() {
  console.log("🧪 Testing Web Search Tool");
  console.log("=".repeat(50));

  const webSearchTool = new WebSearchTool();

  // Test 1: Basic web search
  console.log("\n🔍 Test 1: Basic Web Search");
  console.log("Query: 'twilio sms api 2024'");
  
  try {
    const results = await webSearchTool.search("twilio sms api 2024", {
      maxResults: 5,
      searchEngines: ["google"],
    });

    console.log(`✅ Found ${results.results.length} results`);
    console.log("Top 3 results:");
    results.results.slice(0, 3).forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Source: ${result.source}`);
      console.log(`   Relevance: ${result.relevance.toFixed(2)}`);
      console.log(`   Snippet: ${result.snippet.substring(0, 100)}...`);
    });
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
  }

  // Test 2: Error solutions search
  console.log("\n🔧 Test 2: Error Solutions Search");
  console.log("Error Code: '30001'");
  
  try {
    const results = await webSearchTool.searchErrorSolutions("30001", "authentication");
    console.log(`✅ Found ${results.results.length} results`);
    console.log("Top 2 results:");
    results.results.slice(0, 2).forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Source: ${result.source}`);
    });
  } catch (error) {
    console.error("❌ Test 2 failed:", error.message);
  }

  // Test 3: Twilio updates search
  console.log("\n📰 Test 3: Twilio Updates Search");
  console.log("Query: 'whatsapp api'");
  
  try {
    const results = await webSearchTool.searchTwilioUpdates("whatsapp api");
    console.log(`✅ Found ${results.results.length} results`);
    console.log("Top 2 results:");
    results.results.slice(0, 2).forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Source: ${result.source}`);
    });
  } catch (error) {
    console.error("❌ Test 3 failed:", error.message);
  }

  // Test 4: Community discussions search
  console.log("\n💬 Test 4: Community Discussions Search");
  console.log("Query: 'twilio webhook'");
  
  try {
    const results = await webSearchTool.searchCommunityDiscussions("twilio webhook");
    console.log(`✅ Found ${results.results.length} results`);
    console.log("Top 2 results:");
    results.results.slice(0, 2).forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Source: ${result.source}`);
    });
  } catch (error) {
    console.error("❌ Test 4 failed:", error.message);
  }

  // Test 5: MCP Tool Manager
  console.log("\n🔧 Test 5: MCP Tool Manager");
  
  try {
    console.log("Available tools:");
    const tools = mcpWrapper.toolManager.getAvailableTools();
    tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    console.log("\nTesting tool execution:");
    const webSearchResults = await mcpWrapper.toolManager.executeTool("web_search", "twilio voice api", { maxResults: 3 });
    console.log(`✅ Web search tool executed successfully`);
    console.log(`   Found ${webSearchResults.results.length} results`);
  } catch (error) {
    console.error("❌ Test 5 failed:", error.message);
  }

  // Test 6: Search statistics
  console.log("\n📊 Test 6: Search Statistics");
  
  try {
    const stats = webSearchTool.getSearchStats();
    console.log("Search Tool Statistics:");
    console.log(`  Cache Size: ${stats.cacheSize}`);
    console.log(`  Cache Expiry: ${stats.cacheExpiry}ms`);
    console.log(`  Supported Engines: ${stats.supportedEngines.join(", ")}`);
    console.log(`  Twilio Sources: ${stats.twilioSources.length}`);
  } catch (error) {
    console.error("❌ Test 6 failed:", error.message);
  }

  console.log("\n🎉 Web Search Tool Testing Complete!");
}

// Run tests
testWebSearchTool().catch(console.error);
