import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function createGeminiEmbeddings(chunks) {
  console.log("🔮 Creating Gemini embeddings for chunks...");
  
  const embeddings = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    try {
      console.log(`📝 Embedding chunk ${i + 1}/${chunks.length}: ${chunk.id}`);
      
      const model = genAI.getGenerativeModel({ model: "embedding-001" });
      const result = await model.embedContent(chunk.content);
      const embedding = result.embedding.values;
      
      embeddings.push({
        id: chunk.id,
        content: chunk.content,
        embedding: embedding,
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
  const embeddingsPath = path.join(__dirname, "../data/gemini_embeddings.json");
  fs.writeFileSync(embeddingsPath, JSON.stringify(embeddings, null, 2));
  
  console.log(`✅ Created ${embeddings.length} Gemini embeddings`);
  console.log(`💾 Embeddings saved to: ${embeddingsPath}`);
  
  return embeddings;
}

export async function embedQueryWithGemini(query) {
  try {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(query);
    return result.embedding.values;
  } catch (error) {
    console.error("❌ Error creating query embedding:", error.message);
    throw error;
  }
}
