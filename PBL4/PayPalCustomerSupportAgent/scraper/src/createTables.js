import pool from './database.js';

async function createTables() {
  const client = await pool.connect();
  
  try {
    console.log('Creating tables...');
    
    // Create raw_data table
    await client.query(`
      CREATE TABLE IF NOT EXISTS raw_data (
        id SERIAL PRIMARY KEY,
        source_file VARCHAR(255) NOT NULL,
        original_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create cleaned_data table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cleaned_data (
        id SERIAL PRIMARY KEY,
        source_file VARCHAR(255) NOT NULL,
        title VARCHAR(500),
        content TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create chunks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chunks (
        id SERIAL PRIMARY KEY,
        source_file VARCHAR(255) NOT NULL,
        original_index INTEGER,
        chunk_index INTEGER,
        text TEXT NOT NULL,
        text_search_vector TSVECTOR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS chunks_search_idx 
      ON chunks USING GIN(text_search_vector)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS chunks_source_idx 
      ON chunks(source_file)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS cleaned_source_idx 
      ON cleaned_data(source_file)
    `);
    
    console.log('✅ Tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    client.release();
  }
}

createTables().then(() => {
  console.log('Done!');
  process.exit(0);
});