const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'paypalAgent',
  password: process.env.POSTGRES_PASSWORD || 'your_password_here',
  port: 5432,
});

async function setupChatTables() {
  const client = await pool.connect();
  
  try {
    console.log('Creating chat history table...');
    
    // Create chat_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create conversations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255),
        query TEXT NOT NULL,
        issue_type VARCHAR(100),
        sentiment JSONB,
        top_citations JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_history_session_id 
      ON chat_history(session_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_session_id 
      ON conversations(session_id)
    `);
    
    console.log('✅ Chat tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating chat tables:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

setupChatTables();