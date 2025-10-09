import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Simple config that just exports process.env variables
const config = {
  // AI Provider - Hardcoded to Gemini
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,

  // Database
  MONGODB_URL: process.env.MONGODB_URL,
  MONGODB_DB: process.env.MONGODB_DB,
  MONGODB_URI: process.env.MONGODB_URI,

  // Pinecone Configuration
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
  PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || "stripe-docs",

  // Server
  PORT: process.env.PORT,
  HOST: process.env.HOST,

  // Security
  JWT_SECRET: process.env.JWT_SECRET,

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL,
  FRONTEND_URL_DEV: process.env.FRONTEND_URL_DEV,

  // Processing
  CHUNK_SIZE: process.env.CHUNK_SIZE,
  CHUNK_OVERLAP: process.env.CHUNK_OVERLAP,
  MAX_CHUNKS: process.env.MAX_CHUNKS,
  BATCH_SIZE: process.env.BATCH_SIZE,

  // Rate Limiting
  RATE_LIMIT_DELAY: process.env.RATE_LIMIT_DELAY,
  EMBEDDING_DELAY: process.env.EMBEDDING_DELAY,
};

export default config;
