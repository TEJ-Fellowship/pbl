import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple text-based search without embeddings
export function searchDocuments(query, chunks, limit = 5) {
  const queryWords = query.toLowerCase().split(/\s+/);
  
  const scoredChunks = chunks.map(chunk => {
    const content = (chunk.pageContent || chunk.content || '').toLowerCase();
    let score = 0;
    
    // Remove common words that don't add meaning
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'how', 'when', 'where', 'why', 'who'];
    const meaningfulWords = queryWords.filter(word => !stopWords.includes(word));
    
    // Score based on meaningful words only
    meaningfulWords.forEach(word => {
      if (content.includes(word)) {
        score += 2; // Higher weight for meaningful words
      }
    });
    
    // Boost score for exact phrase matches
    if (content.includes(query.toLowerCase())) {
      score += 10;
    }
    
    // Boost score for question-specific patterns
    if (query.toLowerCase().includes('what is') && content.includes('discord is')) {
      score += 5;
    }
    if (query.toLowerCase().includes('how to') && content.includes('step')) {
      score += 3;
    }
    if (query.toLowerCase().includes('create') && content.includes('create')) {
      score += 3;
    }
    
    // Penalize chunks that are too generic
    if (content.length < 100) {
      score -= 1;
    }
    
    return {
      ...chunk,
      score: Math.max(0, score) // Ensure score is not negative
    };
  });
  
  // Sort by score and return top results
  return scoredChunks
    .filter(chunk => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(chunk => ({
      content: chunk.pageContent || chunk.content || '',
      source: chunk.metadata?.title || 'Discord Documentation',
      score: chunk.score,
      metadata: chunk.metadata || {}
    }));
}

export function loadChunks() {
  try {
    // Try the new processed data location first
    const processedPath = path.join(__dirname, "../../data/processed/discord_chunks.json");
    if (fs.existsSync(processedPath)) {
      const chunks = JSON.parse(fs.readFileSync(processedPath, 'utf-8'));
      console.log(`✅ Loaded ${chunks.length} chunks from processed data`);
      return chunks;
    }
    
    // Fallback to old location
    const metadataPath = path.join(__dirname, "../data/chunks/metadata.json");
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      console.log(`✅ Loaded ${metadata.length} chunks from old location`);
      return metadata;
    }
    
    console.log("❌ No chunks found in any location");
    return [];
  } catch (error) {
    console.error("Error loading chunks:", error.message);
    return [];
  }
}
