import "dotenv/config";
import { createRetriever } from "./retriever.js";
import { embedSingle } from "./utils/embeddings.js";
import { getPineconeIndex } from "../config/pinecone.js";

async function testPineconeIntegration() {
  console.log("🧪 Testing Pinecone Integration...\n");

  try {
    // Test 1: Check environment variables
    console.log("1️⃣ Checking environment variables...");
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY not found in environment");
    }
    console.log("✅ PINECONE_API_KEY found");

    // Test 2: Connect to Pinecone
    console.log("\n2️⃣ Connecting to Pinecone...");
    const index = await getPineconeIndex();
    console.log("✅ Successfully connected to Pinecone");

    // Test 3: Check index stats
    console.log("\n3️⃣ Checking index statistics...");
    const stats = await index.describeIndexStats();
    console.log("📊 Index Stats:", {
      totalVectorCount: stats.totalVectorCount,
      dimension: stats.dimension,
      indexFullness: stats.indexFullness,
    });

    if (stats.totalVectorCount === 0) {
      console.log("⚠️  No vectors found in index. Run 'npm run ingest' first.");
      return;
    }

    // Test 4: Test retrieval
    console.log("\n4️⃣ Testing retrieval...");
    const retriever = await createRetriever();

    const testQuery = "How do I create a product in Shopify?";
    console.log(`🔍 Test query: "${testQuery}"`);

    const queryEmbedding = await embedSingle(testQuery);
    const results = await retriever.queryEmbeddingAware({
      queryEmbedding,
      k: 3,
    });

    console.log(`✅ Retrieved ${results.length} results:`);
    results.forEach((result, i) => {
      console.log(`\n   Result ${i + 1}:`);
      console.log(`   - Score: ${result.score.toFixed(4)}`);
      console.log(`   - Title: ${result.metadata.title}`);
      console.log(`   - Section: ${result.metadata.section}`);
      console.log(`   - Merchant Level: ${result.metadata.merchant_level}`);
      console.log(`   - Text Preview: ${result.doc.substring(0, 100)}...`);
    });

    console.log(
      "\n🎉 All tests passed! Pinecone integration is working correctly."
    );
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error("\n💡 Troubleshooting tips:");
    console.error("1. Ensure your .env file has PINECONE_API_KEY set");
    console.error("2. Verify your Pinecone API key is valid");
    console.error(
      "3. Make sure the index exists and has data (run 'npm run ingest')"
    );
    console.error("4. Check your internet connection");
    process.exit(1);
  }
}

// Run the test
testPineconeIntegration();
