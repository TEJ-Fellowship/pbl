#!/usr/bin/env node

/**
 * Discord Community Support RAG Server
 * Main entry point for the Discord support bot API
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Import the main RAG API
import app from './src/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;

// Start server
app.listen(PORT, () => {
  console.log('🚀 Discord Community Support RAG Server Started!');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📋 Available endpoints:`);
  console.log(`  GET  /api/health - Health check`);
  console.log(`  POST /api/search - Search with RAG`);
  console.log(`  GET  / - API information`);
});

export default app;
