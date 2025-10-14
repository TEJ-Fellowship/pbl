import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function createGeminiEmbeddings(chunks) {
  console.log("🔮 Creating Gemini embeddings for chunks...");
  
  const embeddings = [];
  const BATCH_SIZE = 10; // Process 10 chunks at a time
  
  // Process chunks in batches for much faster processing
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    console.log(`📝 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(chunks.length/BATCH_SIZE)} (${batch.length} chunks)`);
    
    // Process batch in parallel
    const batchPromises = batch.map(async (chunk) => {
      try {
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(chunk.content);
        const embedding = result.embedding.values;
        
        return {
          id: chunk.id,
          content: chunk.content,
          embedding: embedding,
          source: chunk.source,
          chunkIndex: chunk.chunkIndex,
          fileName: chunk.fileName
        };
      } catch (error) {
        console.error(`❌ Error embedding chunk ${chunk.id}:`, error.message);
        return null;
      }
    });
    
    // Wait for all embeddings in this batch to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Add successful results to embeddings array
    batchResults.forEach(result => {
      if (result) embeddings.push(result);
    });
    
    // Small delay between batches to be respectful to API
    if (i + BATCH_SIZE < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  // Save embeddings to file
  const embeddingsPath = path.join(__dirname, "../data/gemini_embeddings.json");
  fs.writeFileSync(embeddingsPath, JSON.stringify(embeddings, null, 2));
  
  console.log(`✅ Created ${embeddings.length} Gemini embeddings`);
  console.log(`💾 Embeddings saved to: ${embeddingsPath}`);
  
  return embeddings;
}

export async function embedQueryWithGemini(query) {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(query);
    return result.embedding.values;
  } catch (error) {
    console.error("❌ Error creating query embedding:", error.message);
    throw error;
  }
}
