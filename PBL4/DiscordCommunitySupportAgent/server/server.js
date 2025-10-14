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
// Note: The server is started in src/server.js
// This file just imports and exports the app

export default app;
