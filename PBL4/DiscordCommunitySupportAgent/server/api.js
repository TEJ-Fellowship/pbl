import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { initializeHybridSearch, hybridSearch } from "./utils/hybridSearch.js";
import { splitDocuments } from "./utils/textSplitter.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Initialize search system
let searchInitialized = false;

async function initializeSearch() {
  try {
    searchInitialized = await initializeHybridSearch();
    if (searchInitialized) {
      console.log("✅ Hybrid search system initialized");
    }
  } catch (error) {
    console.error("❌ Failed to initialize search:", error.message);
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    searchInitialized,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/search', async (req, res) => {
  try {
    const { query, limit = 5, semanticWeight = 0.65, keywordWeight = 0.35 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    if (!searchInitialized) {
      return res.status(503).json({ error: 'Search system not initialized' });
    }
    
    const results = hybridSearch(query, limit, semanticWeight, keywordWeight);
    
    res.json({
      query,
      results,
      totalResults: results.length,
      searchType: 'hybrid',
      weights: { semanticWeight, keywordWeight }
    });
    
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/reprocess', async (req, res) => {
  try {
    console.log("🔄 Reprocessing documents...");
    await splitDocuments();
    searchInitialized = await initializeHybridSearch();
    
    res.json({ 
      message: 'Documents reprocessed successfully',
      searchInitialized 
    });
  } catch (error) {
    console.error('Reprocessing error:', error.message);
    res.status(500).json({ error: 'Failed to reprocess documents' });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Discord Support API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Search endpoint: POST http://localhost:${PORT}/api/search`);
  
  // Initialize search system
  await initializeSearch();
});

export default app;
