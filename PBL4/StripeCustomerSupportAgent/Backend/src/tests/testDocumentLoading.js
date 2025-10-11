import { loadDocumentsFromDB } from "../ingest.js";

async function testDocumentLoading() {
  console.log("🧪 Testing PostgreSQL document loading...");

  try {
    // Test loading documents from PostgreSQL
    const documents = await loadDocumentsFromDB(5);
    console.log(`✅ Loaded ${documents.length} documents from PostgreSQL`);

    documents.forEach((doc, index) => {
      console.log(
        `   ${index + 1}. ${doc.metadata.title || "Untitled"} (${
          doc.metadata.category
        })`
      );
      console.log(`      - URL: ${doc.metadata.source}`);
      console.log(`      - Words: ${doc.metadata.wordCount}`);
      console.log(
        `      - Content preview: ${doc.pageContent.substring(0, 100)}...`
      );
      console.log("");
    });

    console.log("🎉 PostgreSQL document loading test successful!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run the test
testDocumentLoading().catch(console.error);
