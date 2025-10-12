import { splitDocuments } from "./utils/textSplitter.js";
import { createEmbeddings } from "./utils/embeddings.js";
import { setupChromaDatabase, addDocumentsToChroma } from "./chroma/chromaClient.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '.env') });

async function processDocuments() {
  try {
    console.log("🚀 Starting Tier 1 RAG setup...\n");
    
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY not found in environment variables");
      console.log("Please create a .env file with your OpenAI API key:");
      console.log("OPENAI_API_KEY=your_api_key_here");
      process.exit(1);
    }
    
    // Step 1: Split documents into chunks
    console.log("Step 1: Splitting documents into chunks");
    const chunks = await splitDocuments();
    console.log("");
    
    // Step 2: Create embeddings
    console.log("Step 2: Creating embeddings");
    const embeddings = await createEmbeddings(chunks);
    console.log("");
    
    // Step 3: Setup Chroma database
    console.log("Step 3: Setting up Chroma database");
    await setupChromaDatabase();
    console.log("");
    
    // Step 4: Add documents to Chroma
    console.log("Step 4: Adding documents to Chroma");
    await addDocumentsToChroma(embeddings);
    console.log("");
    
    console.log("🎉 Tier 1 RAG setup completed successfully!");
    console.log(`📊 Processed ${chunks.length} chunks with embeddings`);
    console.log("🗄️ Chroma database ready for queries");
    
  } catch (error) {
    console.error("❌ Error in document processing:", error.message);
    process.exit(1);
  }
}

// Run the processing
processDocuments();
