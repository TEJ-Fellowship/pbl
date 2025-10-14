import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Simple config that just exports process.env variables
const config = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,

  // Pinecone Configuration
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
  PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || "mailerbyte-rag",

  // PostgreSQL Configuration (for BM25 search)
  DB_USER: process.env.DB_USER,
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_PORT: process.env.DB_PORT,

  // Processing
  CHUNK_SIZE: process.env.CHUNK_SIZE,
  CHUNK_OVERLAP: process.env.CHUNK_OVERLAP,
  MAX_CHUNKS: process.env.MAX_CHUNKS,

  // Rate Limiting
  RATE_LIMIT_DELAY: process.env.RATE_LIMIT_DELAY,
};

export default config;
