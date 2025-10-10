// test_pipeline.js - Test the complete pipeline with new chunking approach
import { runChunking } from "./src/chunkDoc_v2.js";
import {
  loadPreprocessedChunks,
  convertChunksToDocuments,
} from "./src/ingest.js";
import { detectErrorCodes, detectQueryLanguage } from "./src/chat.js";

async function testPipeline() {
  console.log("🧪 Testing the complete pipeline...");

  try {
    // Test 1: Run chunking
    console.log("\n1️⃣ Testing chunkDoc_v2 chunking...");
    await runChunking();
    console.log("✅ Chunking completed successfully");

    // Test 2: Load chunks
    console.log("\n2️⃣ Testing chunk loading...");
    const { textChunks, codeChunks } = await loadPreprocessedChunks();
    console.log(
      `✅ Loaded ${textChunks.length} text chunks and ${codeChunks.length} code chunks`
    );

    // Test 3: Convert to documents
    console.log("\n3️⃣ Testing document conversion...");
    const documents = await convertChunksToDocuments(textChunks, codeChunks);
    console.log(
      `✅ Converted ${documents.length} chunks to LangChain Documents`
    );

    // Test 4: Test error code detection
    console.log("\n4️⃣ Testing error code detection...");
    const testQueries = [
      "What does error 30001 mean?",
      "How to send SMS in Node.js?",
      "Python webhook signature verification",
      "Error 21211 troubleshooting",
    ];

    testQueries.forEach((query) => {
      const errorCodes = detectErrorCodes(query);
      const language = detectQueryLanguage(query);
      console.log(`   Query: "${query}"`);
      console.log(
        `   Error codes: ${
          errorCodes.length > 0 ? errorCodes.join(", ") : "none"
        }`
      );
      console.log(`   Language: ${language || "none"}`);
    });

    // Test 5: Sample chunk analysis
    console.log("\n5️⃣ Sample chunk analysis...");
    if (textChunks.length > 0) {
      const sampleTextChunk = textChunks[0];
      console.log(`   Text chunk ID: ${sampleTextChunk.id}`);
      console.log(`   Type: ${sampleTextChunk.type}`);
      console.log(`   API: ${sampleTextChunk.api}`);
      console.log(
        `   Error codes: ${sampleTextChunk.errorCodes?.join(", ") || "none"}`
      );
    }

    if (codeChunks.length > 0) {
      const sampleCodeChunk = codeChunks[0];
      console.log(`   Code chunk ID: ${sampleCodeChunk.id}`);
      console.log(`   Type: ${sampleCodeChunk.type}`);
      console.log(`   Language: ${sampleCodeChunk.language}`);
      console.log(`   API: ${sampleCodeChunk.api}`);
      console.log(
        `   Content preview: ${sampleCodeChunk.content.substring(0, 100)}...`
      );
    }

    console.log("\n🎉 All pipeline tests passed successfully!");
    console.log("\n📋 Pipeline Summary:");
    console.log(`   📄 Text chunks: ${textChunks.length}`);
    console.log(`   💻 Code chunks: ${codeChunks.length}`);
    console.log(`   📊 Total chunks: ${textChunks.length + codeChunks.length}`);
    console.log(`   📚 LangChain Documents: ${documents.length}`);
  } catch (error) {
    console.error("❌ Pipeline test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPipeline().catch(console.error);
}

export { testPipeline };
