import pool from './database.js';

function extractCleanText(text) {
  // Simple approach: extract all text content and remove JSON structure
  let cleanText = text;
  
  // Remove all JSON brackets, quotes, and structure
  cleanText = cleanText
    .replace(/\{[^}]*\}/g, ' ') // Remove all {...} blocks
    .replace(/\[[^\]]*\]/g, ' ') // Remove all [...] blocks
    .replace(/"[^"]*":/g, ' ') // Remove "key": patterns
    .replace(/[{}[\]",:]/g, ' ') // Remove remaining JSON characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
  
  return cleanText;
}

async function simpleCleanChunks() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Simple cleaning of chunk data...');
    
    // Get all chunks
    const result = await client.query('SELECT * FROM chunks ORDER BY id');
    const chunks = result.rows;
    
    console.log(`Found ${chunks.length} chunks to clean`);
    
    let cleaned = 0;
    
    for (const chunk of chunks) {
      try {
        const cleanText = extractCleanText(chunk.text);
        
        // Update the chunk with clean text
        await client.query(
          'UPDATE chunks SET text = $1, text_search_vector = to_tsvector($1) WHERE id = $2',
          [cleanText, chunk.id]
        );
        
        cleaned++;
        if (cleaned % 100 === 0) {
          console.log(`✅ Cleaned ${cleaned} chunks...`);
        }
        
      } catch (error) {
        console.error(`❌ Error cleaning chunk ${chunk.id}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Simple cleaning complete!`);
    console.log(`✅ Cleaned: ${cleaned} chunks`);
    
  } catch (error) {
    console.error('❌ Error during cleaning:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

simpleCleanChunks();