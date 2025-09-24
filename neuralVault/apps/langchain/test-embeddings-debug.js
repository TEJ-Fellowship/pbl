import { createEmbeddings } from "./src/config/embeddings.js";
import { config } from "./src/config/index.js";

async function debugEmbeddings() {
  console.log("🔍 Debugging Embeddings API...");
  console.log("================================");

  // Show configuration
  const langchainConfig = config.getLangChainConfig();
  console.log("📋 Configuration:");
  console.log(`  Embedding Model: ${langchainConfig.embeddingModel}`);
  console.log(`  API Key: ${process.env.GEMINI_API_KEY ? "Set" : "Not Set"}`);

  try {
    console.log("\n🔧 Creating embeddings instance...");
    const embeddings = createEmbeddings();
    console.log("✅ Embeddings instance created");

    console.log("\n📝 Testing with simple query...");
    const startTime = Date.now();

    const result = await embeddings.embedQuery("test");

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log("✅ Embeddings API working!");
    console.log(`📊 Response time: ${duration}ms`);
    console.log(`📊 Vector dimension: ${result.length}`);
    console.log(
      `📊 First 3 values: [${result
        .slice(0, 3)
        .map((v) => v.toFixed(4))
        .join(", ")}...]`
    );

    return true;
  } catch (error) {
    console.log("❌ Embeddings API failed:");
    console.log(`   Error: ${error.message}`);
    console.log(`   Error type: ${error.constructor.name}`);
    console.log(`   Stack: ${error.stack}`);
    return false;
  }
}

// Run the debug
debugEmbeddings().then((success) => {
  console.log(`\n🎯 Result: ${success ? "SUCCESS" : "FAILED"}`);
  process.exit(success ? 0 : 1);
});
