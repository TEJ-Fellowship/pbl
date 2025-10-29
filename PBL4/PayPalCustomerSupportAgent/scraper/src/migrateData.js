import pool from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateRawData() {
  const client = await pool.connect();
  
  try {
    console.log('📁 Migrating raw data...');
    
    // Check if data already exists
    const existingCount = await client.query('SELECT COUNT(*) FROM raw_data');
    if (existingCount.rows[0].count > 0) {
      console.log('⚠️ Raw data already exists, skipping...');
      return;
    }
    
    const dataDir = path.resolve(__dirname, './data');
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const rawData = fs.readFileSync(filePath, 'utf8');
      
      // Store raw JSON text (not parsed)
      await client.query(
        'INSERT INTO raw_data (source_file, original_data) VALUES ($1, $2)',
        [file, rawData] // Store as TEXT
      );
      
      console.log(`✅ Migrated: ${file}`);
    }
    
    console.log('✅ Raw data migration complete!');
    
  } catch (error) {
    console.error('❌ Error migrating raw data:', error);
  } finally {
    client.release();
  }
}

async function migrateCleanedData() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Migrating cleaned data...');
    
    // Check if data already exists
    const existingCount = await client.query('SELECT COUNT(*) FROM cleaned_data');
    if (existingCount.rows[0].count > 0) {
      console.log('⚠️ Cleaned data already exists, skipping...');
      return;
    }
    
    const dataDir = path.resolve(__dirname, './data');
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const rawData = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(rawData);
      
      if (Array.isArray(jsonData)) {
        for (const item of jsonData) {
          await client.query(
            'INSERT INTO cleaned_data (source_file, title, content, metadata) VALUES ($1, $2, $3, $4)',
            [
              file,
              item.title || item.question || null,
              item.content || item.text || JSON.stringify(item),
              JSON.stringify(item)
            ]
          );
        }
      } else {
        // Single object
        await client.query(
          'INSERT INTO cleaned_data (source_file, title, content, metadata) VALUES ($1, $2, $3, $4)',
          [
            file,
            jsonData.title || jsonData.question || null,
            jsonData.content || jsonData.text || JSON.stringify(jsonData),
            JSON.stringify(jsonData)
          ]
        );
      }
      
      console.log(`✅ Migrated: ${file}`);
    }
    
    console.log('✅ Cleaned data migration complete!');
    
  } catch (error) {
    console.error('❌ Error migrating cleaned data:', error);
  } finally {
    client.release();
  }
}

async function migrateChunks() {
  const client = await pool.connect();
  
  try {
    console.log('✂️ Migrating chunks...');
    
    // Check if data already exists
    const existingCount = await client.query('SELECT COUNT(*) FROM chunks');
    if (existingCount.rows[0].count > 0) {
      console.log('⚠️ Chunks already exist, skipping...');
      return;
    }
    
    const chunksPath = path.resolve(__dirname, './chunkData/chunks.json');
    const rawChunks = fs.readFileSync(chunksPath, 'utf8');
    const chunks = JSON.parse(rawChunks);
    
    console.log(`Found ${chunks.length} chunks to migrate...`);
    
    for (const chunk of chunks) {
      await client.query(
        'INSERT INTO chunks (source_file, original_index, chunk_index, text, text_search_vector) VALUES ($1, $2, $3, $4, to_tsvector($4))',
        [
          chunk.source,
          chunk.original_index,
          chunk.chunk_index,
          chunk.text
        ]
      );
    }
    
    console.log('✅ Chunks migration complete!');
    
  } catch (error) {
    console.error('❌ Error migrating chunks:', error);
  } finally {
    client.release();
  }
}

async function main() {
  console.log('🚀 Starting complete data migration...');
  
  await migrateRawData();
  await migrateCleanedData();
  await migrateChunks();
  
  console.log('🎉 All data migration complete!');
  process.exit(0);
}

main().catch(console.error);