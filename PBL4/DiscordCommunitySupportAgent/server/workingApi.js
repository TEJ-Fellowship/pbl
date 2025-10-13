import express from "express";
import cors from "cors";
import { initializeHybridSearch, hybridSearch } from "./utils/hybridSearch.js";
import { initializeCrossEncoder } from "./utils/reranker.js";
import { connectToMongoDB, saveConversation, getConversationHistory, saveServerContext, getServerContext } from "./utils/mongodb.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
let searchReady = false;
let mongoReady = false;

async function init() {
  try {
    console.log("🔍 Initializing hybrid search system...");
    searchReady = await initializeHybridSearch();
    console.log("✅ Search initialized:", searchReady);
    
    console.log("🧠 Initializing cross-encoder for re-ranking...");
    const rerankerReady = await initializeCrossEncoder();
    console.log("✅ Cross-encoder initialized:", rerankerReady);
    
    console.log("🗄️ Connecting to MongoDB...");
    const mongoDb = await connectToMongoDB();
    mongoReady = !!mongoDb;
    console.log("✅ MongoDB connected:", mongoReady);
  } catch (error) {
    console.error("❌ Initialization error:", error.message);
  }
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    searchReady,
    mongoReady,
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
    
    // Save conversation if sessionId provided
    if (sessionId && mongoReady) {
      await saveConversation(sessionId, query, results, { enableReranking });
    }
    
    res.json({
      query,
      results,
      totalResults: results.length,
      rerankingEnabled: enableReranking,
      sessionId
    });
    
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Conversation history endpoints
app.get('/api/conversations/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 10 } = req.query;
    
    if (!mongoReady) {
      return res.status(503).json({ error: 'MongoDB not ready' });
    }
    
    const history = await getConversationHistory(sessionId, parseInt(limit));
    
    res.json({
      sessionId,
      history,
      totalConversations: history.length
    });
    
  } catch (error) {
    console.error('Conversation history error:', error.message);
    res.status(500).json({ error: 'Failed to get conversation history' });
  }
});

app.post('/api/server-context', async (req, res) => {
  try {
    const { sessionId, context } = req.body;
    
    if (!sessionId || !context) {
      return res.status(400).json({ error: 'SessionId and context required' });
    }
    
    if (!mongoReady) {
      return res.status(503).json({ error: 'MongoDB not ready' });
    }
    
    const saved = await saveServerContext(sessionId, context);
    
    res.json({
      success: saved,
      sessionId,
      context
    });
    
  } catch (error) {
    console.error('Server context error:', error.message);
    res.status(500).json({ error: 'Failed to save server context' });
  }
});

app.get('/api/server-context/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!mongoReady) {
      return res.status(503).json({ error: 'MongoDB not ready' });
    }
    
    const context = await getServerContext(sessionId);
    
    res.json({
      sessionId,
      context
    });
    
  } catch (error) {
    console.error('Get server context error:', error.message);
    res.status(500).json({ error: 'Failed to get server context' });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Discord Support API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Search endpoint: POST http://localhost:${PORT}/api/search`);
  await init();
});

export default app;
