import { splitDocuments } from "./utils/textSplitter.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processDocumentsWithoutEmbeddings() {
  try {
    console.log("🚀 Starting Tier 1 RAG setup (without embeddings)...\n");
    
    // Step 1: Split documents into chunks
    console.log("Step 1: Splitting documents into chunks");
    const chunks = await splitDocuments();
    console.log("");
    
    console.log("🎉 Document processing completed!");
    console.log(`📊 Processed ${chunks.length} chunks`);
    console.log("💡 You can now use the simple chat interface: node simpleChat.js");
    console.log("🔧 To add embeddings later, fix your OpenAI API key and run: node processDocs.js");
    
  } catch (error) {
    console.error("❌ Error in document processing:", error.message);
    process.exit(1);
  }
}

// Run the processing
processDocumentsWithoutEmbeddings();
