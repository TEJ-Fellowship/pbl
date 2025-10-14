import pool from './database.js';

async function checkChunks() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking chunk data...');
    
    // Get a few chunks to see what's in them
    const result = await client.query('SELECT id, text FROM chunks LIMIT 5');
    
    result.rows.forEach((chunk, i) => {
      console.log(`\n--- Chunk ${chunk.id} ---`);
      console.log(`Text length: ${chunk.text.length}`);
      console.log(`First 200 chars: ${chunk.text.slice(0, 200)}...`);
      console.log(`Last 200 chars: ...${chunk.text.slice(-200)}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkChunks();