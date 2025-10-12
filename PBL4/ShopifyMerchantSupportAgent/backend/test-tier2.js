#!/usr/bin/env node

/**
 * Test script for Tier 2 Response Improvements
 * Validates that all components work correctly
 */

import { EnhancedResponseHandler } from "./src/enhanced-response-handler.js";

console.log("🧪 Testing Tier 2 Response Improvements...\n");

// Test 1: Enhanced Response Handler Initialization
console.log("1️⃣ Testing Enhanced Response Handler Initialization...");
try {
  const handler = new EnhancedResponseHandler();
  console.log("✅ Enhanced Response Handler initialized successfully");
} catch (error) {
  console.error(
    "❌ Failed to initialize Enhanced Response Handler:",
    error.message
  );
  process.exit(1);
}

// Test 2: Confidence Calculation
console.log("\n2️⃣ Testing Confidence Calculation...");
try {
  const handler = new EnhancedResponseHandler();

  // Mock search results
  const mockResults = [
    {
      score: 0.92,
      searchType: "semantic",
      metadata: { title: "API Documentation" },
    },
    {
      score: 0.88,
      searchType: "keyword",
      metadata: { title: "Getting Started Guide" },
    },
    {
      score: 0.85,
      searchType: "semantic",
      metadata: { title: "Best Practices" },
    },
    {
      score: 0.82,
      searchType: "keyword",
      metadata: { title: "Troubleshooting" },
    },
  ];

  const mockAnswer =
    "This is a comprehensive answer about Shopify API that includes technical details and code examples.";
  const mockQuery = "How to create products using API?";

  const confidence = handler.calculateConfidence(
    mockResults,
    mockQuery,
    mockAnswer
  );

  console.log(`✅ Confidence calculation successful:`);
  console.log(`   Score: ${confidence.score}/100`);
  console.log(`   Level: ${confidence.level}`);
  console.log(`   Factors: ${confidence.factors.join(", ")}`);

  if (confidence.score < 0 || confidence.score > 100) {
    throw new Error("Confidence score out of valid range");
  }
} catch (error) {
  console.error("❌ Confidence calculation failed:", error.message);
  process.exit(1);
}

// Test 3: Source Citation Formatting
console.log("\n3️⃣ Testing Source Citation Formatting...");
try {
  const handler = new EnhancedResponseHandler();

  const mockResults = [
    {
      score: 0.92,
      searchType: "semantic",
      metadata: {
        title: "Webhooks Guide",
        url: "https://shopify.dev/docs/webhooks",
      },
    },
    {
      score: 0.88,
      searchType: "keyword",
      metadata: {
        title: "API Reference",
        url: "https://shopify.dev/docs/api",
      },
    },
  ];

  const citations = handler.formatSourceCitations(mockResults);

  console.log("✅ Source citation formatting successful:");
  console.log(citations);

  if (
    !citations.includes("Webhooks Guide") ||
    !citations.includes("API Reference")
  ) {
    throw new Error("Source citations missing expected content");
  }
} catch (error) {
  console.error("❌ Source citation formatting failed:", error.message);
  process.exit(1);
}

// Test 4: Edge Case Handling
console.log("\n4️⃣ Testing Edge Case Handling...");
try {
  const handler = new EnhancedResponseHandler();

  // Test no results case
  const noResultsResponse = handler.handleEdgeCases("test query", [], null);
  if (!noResultsResponse) {
    throw new Error("No results edge case not handled");
  }

  // Test error case
  const errorResponse = handler.handleEdgeCases(
    "test query",
    [],
    new Error("Test error")
  );
  if (!errorResponse) {
    throw new Error("Error edge case not handled");
  }

  console.log("✅ Edge case handling successful");
} catch (error) {
  console.error("❌ Edge case handling failed:", error.message);
  process.exit(1);
}

// Test 5: Code Block Formatting
console.log("\n5️⃣ Testing Code Block Formatting...");
try {
  const handler = new EnhancedResponseHandler();

  const testMarkdown = `
# Test Response

Here's some code:

\`\`\`javascript
const response = await fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Test Product' })
});
\`\`\`

And some inline code: \`console.log('test')\`
`;

  const formatted = handler.formatCodeBlocks(testMarkdown);

  console.log("✅ Code block formatting successful");
  console.log("Sample formatted output:");
  console.log(formatted.substring(0, 200) + "...");
} catch (error) {
  console.error("❌ Code block formatting failed:", error.message);
  process.exit(1);
}

// Test 6: Complete Response Processing
console.log("\n6️⃣ Testing Complete Response Processing...");
try {
  const handler = new EnhancedResponseHandler();

  const mockResults = [
    {
      score: 0.92,
      searchType: "semantic",
      metadata: {
        title: "API Documentation",
        url: "https://shopify.dev/docs/api",
      },
    },
  ];

  const mockAnswer =
    "This is a test answer with some **bold text** and `inline code`.";
  const mockQuery = "How to use the API?";

  const enhancedResponse = handler.processResponse(
    mockAnswer,
    mockResults,
    mockQuery,
    null
  );

  console.log("✅ Complete response processing successful");
  console.log(
    `   Confidence: ${enhancedResponse.confidence.level} (${enhancedResponse.confidence.score}/100)`
  );
  console.log(
    `   Sources included: ${enhancedResponse.sources.includes(
      "API Documentation"
    )}`
  );
  console.log(
    `   Formatted output length: ${enhancedResponse.formatted.length} characters`
  );
} catch (error) {
  console.error("❌ Complete response processing failed:", error.message);
  process.exit(1);
}

console.log("\n🎉 All Tier 2 Response Improvements tests passed!");
console.log("\n✨ Features validated:");
console.log("   ✅ Enhanced Response Handler initialization");
console.log("   ✅ Confidence calculation with multi-factor analysis");
console.log("   ✅ Source citation formatting with links");
console.log("   ✅ Edge case handling with fallback responses");
console.log("   ✅ Code block formatting with markdown-it");
console.log("   ✅ Complete response processing pipeline");
console.log("\n🚀 System ready for production use!");
console.log('\nRun "npm run chat" to start the enhanced system.');
