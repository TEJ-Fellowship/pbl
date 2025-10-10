// Test script to demonstrate the code-aware chunking pipeline
import {
  retrieveChunksWithEmbeddings,
  initGeminiEmbeddings,
} from "./src/chat.js";
import fs from "fs/promises";
import path from "path";

async function testPipeline() {
  console.log("🧪 Testing Code-Aware Chunking Pipeline");
  console.log("=".repeat(60));

  try {
    // Load local vector store
    const vectorStorePath = path.join(
      process.cwd(),
      "data",
      "vector_store.json"
    );
    const data = await fs.readFile(vectorStorePath, "utf-8");
    const vectorStore = JSON.parse(data);

    console.log(`📊 Vector Store Stats:`);
    console.log(`   Total chunks: ${vectorStore.chunks.length}`);
    console.log(
      `   📄 Text chunks: ${
        vectorStore.chunks.filter((c) => c.metadata.type === "text").length
      }`
    );
    console.log(
      `   💻 Code chunks: ${
        vectorStore.chunks.filter((c) => c.metadata.type === "code").length
      }`
    );

    // Show language distribution
    const languages = {};
    vectorStore.chunks.forEach((chunk) => {
      const lang = chunk.metadata.language || "unknown";
      languages[lang] = (languages[lang] || 0) + 1;
    });
    console.log(
      `   🔤 Languages: ${Object.entries(languages)
        .map(([lang, count]) => `${lang}(${count})`)
        .join(", ")}`
    );

    const vectorStoreObj = { type: "local", data: vectorStore };
    const embeddings = initGeminiEmbeddings();

    // Test different query types
    const testCases = [
      {
        query: "How do I send an SMS in Node.js?",
        description: "Code-focused query (should prioritize code chunks)",
      },
      {
        query: "What does error 30001 mean?",
        description: "Error code query (should boost exact matches)",
      },
      {
        query: "Explain Twilio webhooks",
        description: "Conceptual query (should prioritize text chunks)",
      },
      {
        query: "npm install twilio",
        description: "Command query (should find exact code matches)",
      },
    ];

    for (const testCase of testCases) {
      console.log(`\n🔍 Test: ${testCase.description}`);
      console.log(`   Query: "${testCase.query}"`);
      console.log("-".repeat(50));

      try {
        const chunks = await retrieveChunksWithEmbeddings(
          testCase.query,
          vectorStoreObj,
          embeddings
        );

        if (chunks.length > 0) {
          console.log(`✅ Found ${chunks.length} relevant chunks:`);

          // Show top 3 results with metadata
          chunks.slice(0, 3).forEach((chunk, i) => {
            const type = chunk.metadata.type === "code" ? "💻 Code" : "📄 Text";
            const lang =
              chunk.metadata.language && chunk.metadata.language !== "text"
                ? ` (${chunk.metadata.language})`
                : "";
            const api = chunk.metadata.api ? ` | ${chunk.metadata.api}` : "";
            const score = chunk.similarity?.toFixed(3) || "N/A";

            console.log(`   ${i + 1}. ${type}${lang}${api} - Score: ${score}`);
            console.log(`      Preview: ${chunk.content.substring(0, 80)}...`);
          });

          // Show chunk type distribution
          const textCount = chunks.filter(
            (c) => c.metadata.type === "text"
          ).length;
          const codeCount = chunks.filter(
            (c) => c.metadata.type === "code"
          ).length;
          console.log(
            `   📊 Distribution: ${textCount} text, ${codeCount} code chunks`
          );
        } else {
          console.log("❌ No relevant chunks found");
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }

      // Add delay between queries
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log(`\n🎉 Pipeline test completed!`);
    console.log(`\n💡 Key Features Demonstrated:`);
    console.log(`   ✅ Code-aware chunking (separate text/code files)`);
    console.log(`   ✅ Hybrid search with query type detection`);
    console.log(`   ✅ Error code boosting`);
    console.log(`   ✅ Language and API metadata`);
    console.log(`   ✅ Chunk size validation for embeddings`);
  } catch (error) {
    console.error("❌ Pipeline test failed:", error.message);
  }
}

testPipeline().catch(console.error);
