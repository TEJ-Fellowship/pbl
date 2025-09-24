import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

async function testEmbeddingsSimple() {
  console.log("🔍 Testing Embeddings API with Simple Test...");

  try {
    // Use the same configuration as the main app
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "models/text-embedding-004",
      apiKey: "AIzaSyCt9bS3fk5rKhN4lgAffTACG7_yzHoLaQM",
    });

    console.log('📝 Testing with query: "hello world"');

    // Test with a longer timeout
    const testPromise = embeddings.embedQuery("hello world");
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 15000) // 15 second timeout
    );

    const result = await Promise.race([testPromise, timeoutPromise]);

    console.log("✅ Embeddings API working!");
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
    return false;
  }
}

// Run the test
testEmbeddingsSimple().then((success) => {
  console.log(
    success
      ? "🎉 SUCCESS: Embeddings API is working!"
      : "💥 FAILED: Embeddings API is not working"
  );
  process.exit(success ? 0 : 1);
});
