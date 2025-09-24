import { WorkingBatchIngestion } from "./src/ingestion/workingBatchIngestion.js";
import { WorkingVectorStoreManager } from "./src/storage/workingVectorStore.js";
import { DocumentRetriever } from "./src/retrieval/retriever.js";
import { config } from "./src/config/index.js";
import chalk from "chalk";

const debugSystem = async () => {
  console.log(chalk.blue("🔍 System Debug Tool"));
  console.log(chalk.blue("==================="));

  try {
    // Test configuration
    if (!config.validate()) {
      console.log(chalk.red("❌ Configuration validation failed"));
      return;
    }

    console.log(chalk.green("✅ Configuration valid"));

    // Test 1: Document ingestion
    console.log(chalk.yellow("\n1️⃣ Testing document ingestion..."));
    const ingestion = new WorkingBatchIngestion();
    const testFiles = ["./docs/sample.txt"];

    const result = await ingestion.ingestFiles(testFiles);

    if (!result.success) {
      console.log(chalk.red("❌ Ingestion failed"));
      return;
    }

    console.log(
      chalk.green(
        `✅ Ingested ${result.totalChunks} chunks from ${result.processedFiles.length} files`
      )
    );

    // Test 2: Direct vector store search
    console.log(chalk.yellow("\n2️⃣ Testing direct vector store search..."));
    const vectorStore = ingestion.vectorStore;

    if (!vectorStore.isInitialized()) {
      console.log(chalk.red("❌ Vector store not initialized"));
      return;
    }

    console.log(chalk.green("✅ Vector store is initialized"));

    // Test search with timeout
    const testQuery = "What is LangChain?";
    console.log(chalk.cyan(`\n🔍 Testing search: "${testQuery}"`));

    try {
      const startTime = Date.now();
      const searchPromise = vectorStore.similaritySearch(testQuery, 2);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Search timeout after 10 seconds")),
          10000
        )
      );

      const results = await Promise.race([searchPromise, timeoutPromise]);
      const endTime = Date.now();

      console.log(chalk.white(`   Time: ${endTime - startTime}ms`));
      console.log(chalk.white(`   Results: ${results.length}`));

      if (results.length > 0) {
        console.log(chalk.green("   ✅ Direct search successful!"));
        results.forEach((result, index) => {
          console.log(
            chalk.gray(
              `   ${index + 1}. ${result.pageContent.substring(0, 100)}...`
            )
          );
        });
      } else {
        console.log(chalk.yellow("   ⚠️ No results found"));
      }
    } catch (error) {
      if (error.message.includes("timeout")) {
        console.log(chalk.red("   ❌ Search timed out - API issue"));
      } else {
        console.log(chalk.red(`   ❌ Search failed: ${error.message}`));
      }
    }

    // Test 3: Document retriever
    console.log(chalk.yellow("\n3️⃣ Testing document retriever..."));
    const retriever = new DocumentRetriever(vectorStore);

    try {
      const startTime = Date.now();
      const retrievePromise = retriever.retrieveRelevantDocuments(testQuery, 2);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Retrieval timeout after 10 seconds")),
          10000
        )
      );

      const retrievedDocs = await Promise.race([
        retrievePromise,
        timeoutPromise,
      ]);
      const endTime = Date.now();

      console.log(chalk.white(`   Time: ${endTime - startTime}ms`));
      console.log(chalk.white(`   Retrieved: ${retrievedDocs.length}`));

      if (retrievedDocs.length > 0) {
        console.log(chalk.green("   ✅ Retrieval successful!"));
        retrievedDocs.forEach((doc, index) => {
          console.log(
            chalk.gray(`   ${index + 1}. ${doc.content.substring(0, 100)}...`)
          );
        });
      } else {
        console.log(chalk.yellow("   ⚠️ No documents retrieved"));
      }
    } catch (error) {
      if (error.message.includes("timeout")) {
        console.log(chalk.red("   ❌ Retrieval timed out - API issue"));
      } else {
        console.log(chalk.red(`   ❌ Retrieval failed: ${error.message}`));
      }
    }

    // Test 4: Check embeddings configuration
    console.log(chalk.yellow("\n4️⃣ Testing embeddings configuration..."));
    const embeddings = vectorStore.embeddings;
    console.log(
      chalk.white(`   Embeddings type: ${embeddings.constructor.name}`)
    );
    console.log(chalk.white(`   Model: ${embeddings.modelName || "Unknown"}`));

    // Test 5: Check if documents are properly stored
    console.log(chalk.yellow("\n5️⃣ Checking stored documents..."));
    const vectorStoreInstance = vectorStore.getVectorStore();
    if (vectorStoreInstance) {
      console.log(
        chalk.white(
          `   Vector store type: ${vectorStoreInstance.constructor.name}`
        )
      );
      // Try to access the documents directly
      if (vectorStoreInstance.docstore && vectorStoreInstance.docstore._docs) {
        const docCount = Object.keys(vectorStoreInstance.docstore._docs).length;
        console.log(chalk.white(`   Stored documents: ${docCount}`));
      } else {
        console.log(
          chalk.yellow("   ⚠️ Cannot access document store directly")
        );
      }
    }

    console.log(chalk.green("\n🎉 System debug completed!"));
  } catch (error) {
    console.error(chalk.red("❌ Debug failed:"), error.message);
    console.error(chalk.gray(error.stack));
  }
};

// Run debug
debugSystem().catch(console.error);
