import express from "express";
import cors from "cors";
import { initializeHybridSearch, hybridSearch } from "./utils/hybridSearch.js";
import { initializeCrossEncoder } from "./utils/reranker.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
let searchReady = false;
let rerankerReady = false;

async function init() {
  try {
    console.log("🔍 Initializing hybrid search system...");
    searchReady = await initializeHybridSearch();
    console.log("✅ Search initialized:", searchReady);
    
    console.log("🧠 Initializing cross-encoder for re-ranking...");
    rerankerReady = await initializeCrossEncoder();
    console.log("✅ Cross-encoder initialized:", rerankerReady);
  } catch (error) {
    console.error("❌ Initialization error:", error.message);
  }
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    searchReady,
    rerankerReady,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/search', async (req, res) => {
  try {
    const { query, limit = 3, enableReranking = true, sessionId } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }
    
    if (!searchReady) {
      return res.status(503).json({ error: 'Search not ready' });
    }
    
    console.log(`🔍 Searching for: "${query}" (reranking: ${enableReranking})`);
    const results = await hybridSearch(query, limit, 0.65, 0.35, enableReranking);
    console.log(`✅ Found ${results.length} results`);
    
    // Simple session tracking (in-memory, no MongoDB required)
    if (sessionId) {
      console.log(`📝 Session tracked: ${sessionId}`);
    }
    
    res.json({
      query,
      results,
      totalResults: results.length,
      rerankingEnabled: enableReranking,
      sessionId,
      features: {
        hybridSearch: true,
        reranking: rerankerReady,
        mongodb: false
      }
    });
    
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Discord Support API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Search endpoint: POST http://localhost:${PORT}/api/search`);
  console.log(`💡 Note: MongoDB features disabled (no connection configured)`);
  await init();
});
