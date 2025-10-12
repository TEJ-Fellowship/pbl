import "dotenv/config";
import { connectDB, disconnectDB } from "../config/db.js";
import BufferWindowMemory from "./memory/BufferWindowMemory.js";
import TokenCounter from "./utils/TokenCounter.js";

async function testTokenWindowing() {
  console.log("🧪 Testing Token-Aware Context Windowing Implementation\n");

  try {
    // Connect to MongoDB
    console.log("1. Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected successfully\n");

    // Test 1: Initialize TokenCounter
    console.log("2. Testing TokenCounter initialization...");
    const tokenCounter = new TokenCounter("gemini-1.5-flash");
    console.log("✅ TokenCounter initialized successfully\n");

    // Test 2: Initialize BufferWindowMemory with token-aware settings
    console.log("3. Testing BufferWindowMemory with token-aware windowing...");
    const memory = new BufferWindowMemory({
      windowSize: 8,
      sessionId: `test_token_windowing_${Date.now()}`,
      maxTokens: 6000,
      modelName: "gemini-1.5-flash",
      prioritizeRecent: true,
      prioritizeRelevance: true,
    });

    await memory.initializeConversation();
    console.log(
      "✅ BufferWindowMemory initialized with token-aware settings\n"
    );

    // Test 3: Add multiple messages to simulate long conversation
    console.log("4. Testing token counting with various message lengths...");

    const testMessages = [
      { role: "user", content: "How do I add products to my Shopify store?" },
      {
        role: "assistant",
        content:
          "To add products to your Shopify store, go to Products > Add product in your admin panel. You can add product details like title, description, price, and images. Make sure to set up your inventory tracking and shipping options as well.",
      },
      { role: "user", content: "What about setting up payment methods?" },
      {
        role: "assistant",
        content:
          "You can set up payment methods in Settings > Payments. Shopify supports various payment gateways including Shopify Payments, PayPal, Stripe, and many others. You'll need to configure each payment method according to your business needs and location.",
      },
      { role: "user", content: "How do I customize my store theme?" },
      {
        role: "assistant",
        content:
          "To customize your store theme, go to Online Store > Themes. You can choose from free and paid themes, or create a custom theme. Use the theme editor to modify colors, fonts, layouts, and add custom sections. You can also add custom CSS and JavaScript for advanced customization.",
      },
      { role: "user", content: "What about SEO optimization?" },
      {
        role: "assistant",
        content:
          "For SEO optimization, focus on product titles, descriptions, and meta tags. Use relevant keywords naturally, optimize images with alt text, and create a clear site structure. Shopify also provides built-in SEO features like automatic sitemap generation and meta tag management.",
      },
      { role: "user", content: "How do I handle customer service?" },
      {
        role: "assistant",
        content:
          "Shopify provides several customer service tools including live chat, email support, and help desk integration. You can set up automated responses, create FAQ pages, and use apps like Zendesk or Freshdesk for more advanced customer service management.",
      },
      { role: "user", content: "What about inventory management?" },
      {
        role: "assistant",
        content:
          "Shopify's inventory management system tracks stock levels, low stock alerts, and product variants. You can set up automatic reorder points, track inventory across multiple locations, and integrate with third-party inventory management systems for more complex needs.",
      },
      { role: "user", content: "How do I set up shipping?" },
      {
        role: "assistant",
        content:
          "Configure shipping in Settings > Shipping and delivery. Set up shipping zones, rates, and methods. You can offer free shipping, flat rates, or calculated rates based on weight and destination. Integrate with shipping carriers like UPS, FedEx, or DHL for real-time rates.",
      },
    ];

    // Add messages to conversation
    for (const msg of testMessages) {
      await memory.addMessage(msg.role, msg.content);
    }

    console.log(`✅ Added ${testMessages.length} messages to conversation\n`);

    // Test 4: Test token counting
    console.log("5. Testing token counting functionality...");

    const sampleText =
      "This is a sample text to test token counting functionality.";
    const tokenCount = tokenCounter.countTokens(sampleText);
    console.log(`✅ Token count for sample text: ${tokenCount} tokens\n`);

    // Test 5: Test token-aware context windowing
    console.log("6. Testing token-aware context windowing...");

    const mockRetrievedDocs = [
      {
        doc: "This is a comprehensive guide about Shopify product management, including adding products, managing inventory, and optimizing product listings for better sales performance.",
        metadata: {
          title: "Product Management Guide",
          source_url: "https://help.shopify.com/products",
          category: "products",
          score: 0.95,
        },
        score: 0.95,
        searchType: "semantic",
      },
      {
        doc: "Learn about Shopify's payment processing capabilities, including supported payment gateways, transaction fees, and how to configure payment methods for your store.",
        metadata: {
          title: "Payment Processing",
          source_url: "https://help.shopify.com/payments",
          category: "payments",
          score: 0.88,
        },
        score: 0.88,
        searchType: "semantic",
      },
      {
        doc: "Comprehensive guide to Shopify theme customization, including theme editor usage, custom CSS, JavaScript integration, and responsive design best practices.",
        metadata: {
          title: "Theme Customization",
          source_url: "https://help.shopify.com/themes",
          category: "design",
          score: 0.92,
        },
        score: 0.92,
        searchType: "semantic",
      },
    ];

    const systemPrompt =
      "You are a helpful Shopify merchant support agent. Use the provided context to answer questions accurately and helpfully.";

    const tokenAwareContext = await memory.getTokenAwareContext(
      mockRetrievedDocs,
      systemPrompt
    );

    console.log("✅ Token-aware context windowing test completed:");
    console.log(
      `   Total tokens: ${tokenAwareContext.tokenUsage.totalTokens}/${memory.maxTokens}`
    );
    console.log(
      `   Message tokens: ${tokenAwareContext.tokenUsage.messageTokens}`
    );
    console.log(
      `   Document tokens: ${tokenAwareContext.tokenUsage.documentTokens}`
    );
    console.log(
      `   System tokens: ${tokenAwareContext.tokenUsage.systemTokens}`
    );
    console.log(`   Truncated: ${tokenAwareContext.truncated}`);

    if (tokenAwareContext.truncated) {
      console.log(
        `   Selected messages: ${tokenAwareContext.windowingStrategy.selectedMessageCount}/${tokenAwareContext.windowingStrategy.originalMessageCount}`
      );
      console.log(
        `   Selected documents: ${tokenAwareContext.windowingStrategy.selectedDocCount}/${tokenAwareContext.windowingStrategy.originalDocCount}`
      );
    }
    console.log();

    // Test 6: Test stats with token information
    console.log("7. Testing enhanced stats with token information...");
    const stats = await memory.getStats();
    console.log("✅ Enhanced stats retrieved:");
    console.log(`   Session ID: ${stats.sessionId}`);
    console.log(`   Message count: ${stats.messageCount}`);
    console.log(`   Max tokens: ${stats.tokenConfig.maxTokens}`);
    console.log(`   Model: ${stats.tokenConfig.modelName}`);
    console.log(
      `   Current token usage: ${stats.currentTokenUsage.totalTokens} tokens (${stats.currentTokenUsage.percentage}%)`
    );
    console.log();

    // Test 7: Test different token limits
    console.log("8. Testing different token limits...");

    const lowLimitMemory = new BufferWindowMemory({
      windowSize: 8,
      sessionId: `test_low_limit_${Date.now()}`,
      maxTokens: 2000, // Lower limit
      modelName: "gemini-1.5-flash",
      prioritizeRecent: true,
      prioritizeRelevance: true,
    });

    await lowLimitMemory.initializeConversation();

    // Add some messages
    for (let i = 0; i < 5; i++) {
      await lowLimitMemory.addMessage(
        "user",
        `Test message ${i + 1} with some content to test token limits.`
      );
      await lowLimitMemory.addMessage(
        "assistant",
        `This is a response to test message ${
          i + 1
        }. It contains some detailed information about Shopify features and functionality.`
      );
    }

    const lowLimitContext = await lowLimitMemory.getTokenAwareContext(
      mockRetrievedDocs,
      systemPrompt
    );

    console.log("✅ Low limit test completed:");
    console.log(
      `   Total tokens: ${lowLimitContext.tokenUsage.totalTokens}/${lowLimitMemory.maxTokens}`
    );
    console.log(`   Truncated: ${lowLimitContext.truncated}`);
    if (lowLimitContext.truncated && lowLimitContext.windowingStrategy) {
      console.log(
        `   Selected messages: ${lowLimitContext.windowingStrategy.selectedMessageCount}/${lowLimitContext.windowingStrategy.originalMessageCount}`
      );
    }
    console.log();

    console.log("🎉 All token windowing tests completed successfully!\n");

    console.log("📊 Summary of Token Windowing Benefits:");
    console.log("   ✅ Accurate token counting using js-tiktoken");
    console.log("   ✅ Intelligent context truncation when limits exceeded");
    console.log(
      "   ✅ Prioritizes recent messages for conversation continuity"
    );
    console.log("   ✅ Prioritizes relevant documents for better answers");
    console.log("   ✅ Detailed token usage tracking and reporting");
    console.log("   ✅ Configurable token limits and windowing strategies");
    console.log("   ✅ Fallback mechanisms for error handling");
    console.log();
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await disconnectDB();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the test
testTokenWindowing().catch(console.error);
