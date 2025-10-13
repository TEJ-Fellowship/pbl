import { splitDocuments } from "./utils/textSplitter.js";
import { createGeminiEmbeddings } from "./utils/geminiEmbeddings.js";
import { setupChromaDatabase, addDocumentsToChroma } from "./chroma/chromaClient.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '.env') });

async function processDocumentsWithGemini() {
  try {
    console.log("🚀 Starting Tier 1 RAG setup with Gemini AI...\n");
    
    // Check for Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY not found in environment variables");
      console.log("Please add your Gemini API key to the .env file:");
      console.log("GEMINI_API_KEY=your_gemini_api_key_here");
      process.exit(1);
    }
    
    // Step 1: Split documents into chunks
    console.log("Step 1: Splitting documents into chunks");
    const chunks = await splitDocuments();
    console.log("");
    
    // Step 2: Create Gemini embeddings
    console.log("Step 2: Creating Gemini embeddings");
    const embeddings = await createGeminiEmbeddings(chunks);
    console.log("");
    
    // Step 3: Setup Chroma database
    console.log("Step 3: Setting up Chroma database");
    await setupChromaDatabase();
    console.log("");
    
    // Step 4: Add documents to Chroma
    console.log("Step 4: Adding documents to Chroma");
    await addDocumentsToChroma(embeddings);
    console.log("");
    
    console.log("🎉 Tier 1 RAG setup with Gemini completed successfully!");
    console.log(`📊 Processed ${chunks.length} chunks with Gemini embeddings`);
    console.log("🗄️ Chroma database ready for semantic queries");
    console.log("🚀 Run 'node chatCLI.js' to test semantic search!");
    
  } catch (error) {
    console.error("❌ Error in document processing:", error.message);
    process.exit(1);
  }
}

// Run the processing
processDocumentsWithGemini();
