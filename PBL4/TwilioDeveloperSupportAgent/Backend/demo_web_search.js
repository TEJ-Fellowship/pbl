// Backend/demo_web_search.js
// Demonstration of web search functionality with mock data

import WebSearchTool from "./src/webSearchTool.js";
import mcpWrapper from "./src/mcpWrapper.js";

async function demonstrateWebSearch() {
  console.log("🎯 Web Search Tool Demonstration");
  console.log("=".repeat(50));

  const webSearchTool = new WebSearchTool();

  // Demonstrate query generation
  console.log("\n📝 Query Generation Examples:");
  const testQueries = [
    "twilio sms api",
    "error 30001",
    "webhook issues",
    "recent updates"
  ];

  testQueries.forEach(query => {
    const generatedQueries = webSearchTool.generateSearchQueries(query);
    console.log(`\nOriginal: "${query}"`);
    console.log(`Generated: ${generatedQueries.slice(0, 3).join(", ")}...`);
  });

  // Demonstrate error code extraction
  console.log("\n🔍 Error Code Detection:");
  const errorQueries = [
    "I'm getting error 30001 when trying to authenticate",
    "The API returned 20003 error code",
    "How to fix 40001 error in Twilio",
    "Error 50001 is causing issues"
  ];

  errorQueries.forEach(query => {
    const errorCodes = webSearchTool.extractErrorCodes(query);
    console.log(`"${query}" → Error codes: [${errorCodes.join(", ")}]`);
  });

  // Demonstrate source identification
  console.log("\n🌐 Source Identification:");
  const testUrls = [
    "https://www.twilio.com/docs/sms/quickstart",
    "https://github.com/twilio/twilio-node",
    "https://stackoverflow.com/questions/twilio-sms",
    "https://reddit.com/r/twilio",
    "https://dev.to/twilio-tutorial",
    "https://medium.com/@twilio/updates",
    "https://support.twilio.com/hc/en-us",
    "https://example.com/random-site"
  ];

  testUrls.forEach(url => {
    const source = webSearchTool.identifySource(url);
    console.log(`${url} → ${source}`);
  });

  // Demonstrate relevance scoring
  console.log("\n📊 Relevance Scoring Examples:");
  const scoringExamples = [
    {
      title: "Twilio SMS API Documentation",
      snippet: "Learn how to send SMS messages using Twilio's REST API",
      query: "twilio sms api"
    },
    {
      title: "Error 30001 Authentication Failed",
      snippet: "This error occurs when your Twilio credentials are invalid",
      query: "error 30001"
    },
    {
      title: "Random Article About Weather",
      snippet: "Today's weather is sunny with a chance of rain",
      query: "twilio webhook"
    }
  ];

  scoringExamples.forEach(example => {
    const relevance = webSearchTool.calculateRelevance(
      example.title,
      example.snippet,
      example.query
    );
    console.log(`Query: "${example.query}"`);
    console.log(`Title: "${example.title}"`);
    console.log(`Relevance Score: ${relevance.toFixed(2)}`);
    console.log("---");
  });

  // Demonstrate MCP tool manager
  console.log("\n🔧 MCP Tool Manager Features:");
  const tools = mcpWrapper.toolManager.getAvailableTools();
  console.log("Available Tools:");
  tools.forEach(tool => {
    console.log(`  ✅ ${tool.name}: ${tool.description}`);
  });

  // Demonstrate search statistics
  console.log("\n📈 Search Statistics:");
  const stats = webSearchTool.getSearchStats();
  console.log(`Cache Size: ${stats.cacheSize}`);
  console.log(`Cache Expiry: ${stats.cacheExpiry}ms`);
  console.log(`Supported Engines: ${stats.supportedEngines.join(", ")}`);
  console.log(`Twilio Sources: ${stats.twilioSources.length}`);

  // Demonstrate mock search results
  console.log("\n🎭 Mock Search Results (Simulated):");
  const mockResults = {
    query: "twilio sms api 2024",
    results: [
      {
        title: "Twilio SMS API Documentation - 2024 Updates",
        url: "https://www.twilio.com/docs/sms/api",
        snippet: "Complete guide to Twilio's SMS API with latest 2024 features and improvements",
        source: "twilio_official",
        relevance: 9.5,
        timestamp: new Date().toISOString()
      },
      {
        title: "How to Send SMS with Twilio in 2024",
        url: "https://dev.to/twilio/sms-2024",
        snippet: "Step-by-step tutorial for sending SMS messages using Twilio's updated API",
        source: "dev_to",
        relevance: 8.2,
        timestamp: new Date().toISOString()
      },
      {
        title: "Twilio SMS API Error 30001 - Authentication Issues",
        url: "https://stackoverflow.com/questions/twilio-30001",
        snippet: "Common solutions for Twilio authentication errors when using the SMS API",
        source: "stackoverflow",
        relevance: 7.8,
        timestamp: new Date().toISOString()
      }
    ],
    totalFound: 3,
    searchEngines: ["google", "duckduckgo"],
    timestamp: new Date().toISOString()
  };

  console.log(`Query: "${mockResults.query}"`);
  console.log(`Total Results: ${mockResults.totalFound}`);
  console.log("\nTop Results:");
  mockResults.results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.title}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Source: ${result.source}`);
    console.log(`   Relevance: ${result.relevance}`);
    console.log(`   Snippet: ${result.snippet}`);
  });

  console.log("\n🎉 Web Search Tool Demonstration Complete!");
  console.log("\n💡 Key Features Demonstrated:");
  console.log("  ✅ Intelligent query generation");
  console.log("  ✅ Error code detection");
  console.log("  ✅ Source identification");
  console.log("  ✅ Relevance scoring");
  console.log("  ✅ MCP tool integration");
  console.log("  ✅ Caching and performance");
  console.log("  ✅ Multiple search engines");
  console.log("  ✅ Specialized search types");
}

// Run demonstration
demonstrateWebSearch().catch(console.error);
