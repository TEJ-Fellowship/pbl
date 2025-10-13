import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function createEmbeddings(chunks) {
  console.log("🔮 Creating embeddings for chunks...");
  
  const embeddings = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    try {
      console.log(`📝 Embedding chunk ${i + 1}/${chunks.length}: ${chunk.id}`);
      
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk.content,
      });
      
      embeddings.push({
        id: chunk.id,
        content: chunk.content,
        embedding: response.data[0].embedding,
        source: chunk.source,
        chunkIndex: chunk.chunkIndex,
        fileName: chunk.fileName
      });
      
      // Add small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error embedding chunk ${chunk.id}:`, error.message);
    }
  }
  
  // Save embeddings to file
  const embeddingsPath = path.join(__dirname, "../data/embeddings.json");
  fs.writeFileSync(embeddingsPath, JSON.stringify(embeddings, null, 2));
  
  console.log(`✅ Created ${embeddings.length} embeddings`);
  console.log(`💾 Embeddings saved to: ${embeddingsPath}`);
  
  return embeddings;
}

export async function embedQuery(query) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error("❌ Error creating query embedding:", error.message);
    throw error;
  }
}
