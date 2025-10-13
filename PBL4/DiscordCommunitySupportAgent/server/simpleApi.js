import express from "express";
import cors from "cors";
import { initializeHybridSearch, hybridSearch } from "./utils/hybridSearch.js";

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize search
let searchReady = false;

async function init() {
  try {
    searchReady = await initializeHybridSearch();
    console.log("✅ Search initialized:", searchReady);
  } catch (error) {
    console.error("❌ Search init error:", error.message);
  }
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    searchReady,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/search', (req, res) => {
  try {
    const { query, limit = 3 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }
    
    if (!searchReady) {
      return res.status(503).json({ error: 'Search not ready' });
    }
    
    const results = hybridSearch(query, limit);
    
    res.json({
      query,
      results,
      totalResults: results.length
    });
    
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
  await init();
});

export default app;
