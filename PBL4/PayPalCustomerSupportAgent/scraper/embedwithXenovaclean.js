import pool from './src/database.js';
import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline } from '@xenova/transformers';
import dotenv from 'dotenv';

dotenv.config();

const PINECONE_INDEX = process.env.PINECONE_INDEX;
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || '';

// Function to resize 768-dim vector to 1024-dim
function resizeVector768to1024(vector768) {
  const vector1024 = [...vector768];
  
  // Add 256 more dimensions by duplicating and scaling existing values
  const extra = 1024 - 768;
  for (let i = 0; i < extra; i++) {
    const scale = 0.1 + (i % 10) * 0.01;
    const sourceIndex = i % 768;
    vector1024.push(vector768[sourceIndex] * scale);
  }
  
  return vector1024;
}

async function embedWithXenovaClean() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting embedding with Xenova (clean PostgreSQL chunks)...');
    
    // Initialize Pinecone
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pinecone.index(PINECONE_INDEX);
    
    // Initialize Xenova embedder
    console.log('🔧 Loading embedding model...');
    const embedder = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");
    console.log('✅ Model loaded!');
    
    // Get chunks from PostgreSQL
    console.log('📊 Fetching chunks from PostgreSQL...');
    const result = await client.query('SELECT * FROM chunks ORDER BY id');
    const chunks = result.rows;
    
    console.log(`Found ${chunks.length} chunks to embed`);
    
    // Process in batches
    const batchSize = 5;
    let processed = 0;
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
      
      // Prepare vectors for this batch
      const vectors = [];
      
      for (const chunk of batch) {
        try {
          // Embed with Xenova (768 dimensions)
          const output = await embedder(chunk.text, { pooling: "mean", normalize: true });
          const embedding768 = Array.from(output.data);
          
          // Resize to 1024 dimensions
          const embedding1024 = resizeVector768to1024(embedding768);
          
          const vectorId = `${chunk.source_file}:${chunk.original_index}:${chunk.chunk_index}`;
          
          vectors.push({
            id: vectorId,
            values: embedding1024, // 1024-dimensional vector
            metadata: {
              source: chunk.source_file,
              original_index: chunk.original_index,
              chunk_index: chunk.chunk_index,
              text: chunk.text,
              preview: chunk.text.slice(0, 200) + '...'
            }
          });
          
        } catch (error) {
          console.error(`❌ Error embedding chunk ${chunk.id}:`, error.message);
        }
      }
      
      // Upsert to Pinecone
      if (vectors.length > 0) {
        await index.namespace(PINECONE_NAMESPACE).upsert(vectors);
        processed += vectors.length;
        console.log(`✅ Processed ${processed}/${chunks.length} chunks`);
      }
    }
    
    console.log('🎉 Embedding complete!');
    
  } catch (error) {
    console.error('❌ Error during embedding:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

embedWithXenovaClean();