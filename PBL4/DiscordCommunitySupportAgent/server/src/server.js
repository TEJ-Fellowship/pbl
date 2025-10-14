import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { searchSimilarDocuments } from './utils/chromaClient.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeHybridSearch, hybridSearch } from './utils/enhancedHybridSearch.js';
import { initializeCrossEncoder } from './utils/reranker.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Initialize advanced search features
let hybridSearchReady = false;
let crossEncoderReady = false;

async function initializeAdvancedSearch() {
  try {
    console.log('🔧 Initializing advanced search features...');
    
    // Initialize hybrid search
    hybridSearchReady = await initializeHybridSearch();
    
    // Initialize cross-encoder for re-ranking
    console.log('🔄 Initializing cross-encoder re-ranking...');
    crossEncoderReady = await initializeCrossEncoder();
    
    console.log(`✅ Hybrid search: ${hybridSearchReady ? 'Ready' : 'Failed'}`);
    console.log(`✅ Cross-encoder reranking: ${crossEncoderReady ? 'Ready' : 'Failed'}`);
    
  } catch (error) {
    console.error('❌ Advanced search initialization failed:', error.message);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Generate AI answer using RAG with Discord-style formatting
async function generateRAGAnswer(query, retrievedDocs, serverContext = {}) {
  try {
    const context = retrievedDocs.map((doc, index) => 
      `Source ${index + 1} (${doc.metadata.source}):\n${doc.content}\n`
    ).join('\n');

    const serverType = serverContext.type || 'general';
    const serverSize = serverContext.size || 'unknown';

    const prompt = `You are a Discord Community Support Agent. Answer this question based on the Discord documentation provided.

User Question: ${query}
Server Context: ${serverType} server (${serverSize} members)

Discord Documentation:
${context}

Instructions:
1. Provide a detailed, step-by-step answer based on the context above
2. Use Discord-specific terminology correctly (channels, roles, permissions, etc.)
3. Format your response with Discord-style markdown:
   - Use **bold** for important terms and headings
   - Use \`code blocks\` for commands, settings, and file names
   - Use > blockquotes for important notes and warnings
   - Use numbered lists (1., 2., 3.) for step-by-step instructions
   - Use bullet points (•) for sub-steps or additional information
4. Include relevant Discord emojis (⚙️, 🔒, ➕, 📝, 🎮, 💻, 📱, 🌐, etc.)
5. For account creation queries, provide specific steps like:
   - Download Discord app or visit website
   - Click "Register" button
   - Enter email, username, password
   - Verify email
   - Complete setup
6. Be detailed and actionable - don't just say "refer to the guide"
7. If the context contains specific steps, use them exactly
8. Make it beginner-friendly with clear explanations

Answer:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Error generating answer:", error.message);
    return "I apologize, but I'm having trouble generating an answer right now.";
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not configured',
    features: {
      hybridSearch: hybridSearchReady,
      bm25Search: hybridSearchReady,
      faissSearch: hybridSearchReady,
      semanticSearch: true,
      sentenceTransformer: hybridSearchReady,
      reranking: crossEncoderReady ? 'enabled' : 'disabled'
    },
    searchMethods: {
      semantic: 'Vector similarity search using SentenceTransformer embeddings',
      bm25: 'Probabilistic keyword search with term frequency',
      faiss: 'Fast semantic similarity using FAISS index',
      hybrid: 'Combined BM25 + FAISS search with configurable weights (α, β)',
      reranking: 'Cross-encoder re-ranking (optional)'
    },
    normalizationMethods: {
      minmax: 'Min-max normalization (0-1 range)',
      softmax: 'Softmax normalization with temperature',
      none: 'No normalization'
    }
  });
});

// Enhanced search endpoint with BM25 + FAISS hybrid search
app.post('/api/search', async (req, res) => {
  try {
    const { 
      query, 
      sessionId, 
      serverContext = {}, 
      useHybridSearch = true, 
      enableReranking = crossEncoderReady, // Enable by default if available
      alpha = 0.7,  // Weight for semantic search
      beta = 0.3,   // Weight for BM25 search
      normalizationMethod = 'minmax'
    } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Query is required',
        success: false 
      });
    }
    
    console.log(`🔍 Enhanced Search: "${query}" (hybrid: ${useHybridSearch && hybridSearchReady})`);
    console.log(`⚖️ Weights - Semantic (α): ${alpha}, BM25 (β): ${beta}`);
    
    let retrievedDocs = [];
    let searchMethod = 'semantic';
    
    // Use enhanced hybrid search if available, otherwise fallback to semantic search
    if (useHybridSearch && hybridSearchReady) {
      console.log('🔀 Using enhanced hybrid search (BM25 + FAISS + SentenceTransformer)...');
      const hybridResults = await hybridSearch(query, 8, alpha, beta, enableReranking, normalizationMethod);
      
      retrievedDocs = hybridResults.map(result => ({
        content: result.content,
        metadata: {
          source: result.source || 'unknown',
          chunkIndex: result.docIndex || 0,
          fileName: result.metadata?.fileName || 'unknown'
        },
        similarity: result.combinedScore || result.score || 0,
        semanticScore: result.semanticScore || 0,
        keywordScore: result.keywordScore || 0,
        bm25Score: result.bm25Score || 0,
        faissScore: result.faissScore || 0,
        crossEncoderScore: result.crossEncoderScore || 0,
        searchMethod: result.searchMethod || 'hybrid'
      }));
      
      searchMethod = 'hybrid';
      
    } else {
      console.log('🔍 Using semantic search only...');
      const results = await searchSimilarDocuments(query, 8);
      
      if (!results.documents || results.documents.length === 0) {
        return res.json({
          success: true,
          query,
          answer: "I couldn't find relevant information about that topic. Please try rephrasing your question.",
          sources: [],
          sessionId,
          searchMethod: 'semantic'
        });
      }
      
      retrievedDocs = results.documents[0].map((doc, index) => ({
        content: doc,
        metadata: results.metadatas[0][index],
        similarity: 1 - results.distances[0][index],
        semanticScore: 1 - results.distances[0][index],
        keywordScore: 0,
        bm25Score: 0,
        crossEncoderScore: 0,
        searchMethod: 'semantic'
      }));
      
      searchMethod = 'semantic';
    }
    
    if (retrievedDocs.length === 0) {
      return res.json({
        success: true,
        query,
        answer: "I couldn't find relevant information about that topic. Please try rephrasing your question.",
        sources: [],
        sessionId,
        searchMethod
      });
    }
    
    // Generate AI answer with server context
    console.log('🤖 Generating AI answer...');
    const answer = await generateRAGAnswer(query, retrievedDocs, serverContext);
    
    // Return response in format expected by frontend
    res.json({
      success: true,
      query,
      answer,
      results: retrievedDocs.map(doc => ({
        content: doc.content,
        source: doc.metadata.source,
        combinedScore: doc.similarity,
        score: doc.similarity,
        metadata: doc.metadata,
        semanticScore: doc.semanticScore,
        keywordScore: doc.keywordScore,
        bm25Score: doc.bm25Score,
        faissScore: doc.faissScore,
        crossEncoderScore: doc.crossEncoderScore,
        searchMethod: doc.searchMethod
      })),
      sources: retrievedDocs.map(doc => ({
        source: doc.metadata.source,
        similarity: doc.similarity,
        semanticScore: doc.semanticScore,
        keywordScore: doc.keywordScore,
        bm25Score: doc.bm25Score,
        faissScore: doc.faissScore,
        crossEncoderScore: doc.crossEncoderScore,
        searchMethod: doc.searchMethod
      })),
      sessionId,
      searchMethod,
      features: {
        hybridSearch: hybridSearchReady,
        reranking: enableReranking && crossEncoderReady,
        serverContext: Object.keys(serverContext).length > 0
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ 
      error: 'Search failed', 
      success: false,
      message: error.message
    });
  }
});

// Server context endpoint
app.post('/api/server-context', (req, res) => {
  try {
    const { sessionId, serverType, serverSize, purpose } = req.body;
    
    // Store server context (in a real app, this would go to MongoDB)
    console.log(`📝 Server context updated for ${sessionId}: ${serverType} server (${serverSize} members) - ${purpose}`);
    
    res.json({
      success: true,
      sessionId,
      serverContext: {
        type: serverType,
        size: serverSize,
        purpose: purpose,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Server context error:', error.message);
    res.status(500).json({ error: 'Failed to update server context' });
  }
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, email, serverType, serverSize, purpose } = req.body;
    
    // In a real app, you would validate credentials against a database
    // For now, we'll just create a mock user session
    const user = {
      id: Date.now().toString(),
      username,
      email,
      serverContext: {
        type: serverType || 'general',
        size: serverSize || 'unknown',
        purpose: purpose || 'community'
      },
      loginTime: new Date().toISOString()
    };
    
    console.log(`🔐 User login: ${username} (${email}) - ${serverType} server`);
    
    res.json({
      success: true,
      user,
      message: 'Login successful'
    });
    
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ 
      error: 'Login failed', 
      success: false,
      message: error.message
    });
  }
});

app.post('/api/auth/signup', (req, res) => {
  try {
    const { username, email, serverType, serverSize, purpose } = req.body;
    
    // In a real app, you would create a new user account
    // For now, we'll just create a mock user
    const user = {
      id: Date.now().toString(),
      username,
      email,
      serverContext: {
        type: serverType || 'general',
        size: serverSize || 'unknown',
        purpose: purpose || 'community'
      },
      signupTime: new Date().toISOString()
    };
    
    console.log(`📝 User signup: ${username} (${email}) - ${serverType} server`);
    
    res.json({
      success: true,
      user,
      message: 'Account created successfully'
    });
    
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ 
      error: 'Signup failed', 
      success: false,
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log('🚀 Discord Community Support API Server Started!');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
  
  // Initialize advanced search features
  await initializeAdvancedSearch();
  
  console.log('\n📋 Available endpoints:');
  console.log('  GET  /api/health - Health check');
  console.log('  POST /api/search - Enhanced RAG search (BM25 + FAISS + SentenceTransformer)');
  console.log('  POST /api/server-context - Update server context');
  console.log('  POST /api/auth/login - User login');
  console.log('  POST /api/auth/signup - User registration');
  console.log('\n✨ Enhanced Features:');
  console.log('  🔀 Hybrid Search: BM25 keyword + FAISS semantic search');
  console.log('  📊 BM25 Algorithm: Probabilistic ranking with term frequency');
  console.log('  🧠 FAISS Search: Fast semantic similarity using SentenceTransformer');
  console.log('  🔤 SentenceTransformer: all-MiniLM-L6-v2 embeddings');
  console.log('  ⚖️ Configurable Weights: α (semantic) + β (BM25) = 1.0');
  console.log('  📊 Normalization: MinMax, Softmax, or None');
  console.log(`  🔄 Cross-encoder Re-ranking: ${crossEncoderReady ? 'Enabled' : 'Disabled'}`);
  console.log('  🤖 AI Answers: Gemini-generated responses');
  console.log('  📝 Discord Markdown: Proper formatting');
  console.log('  🎯 Server Context: Gaming/study/community awareness');
  console.log('\n🔧 Enhanced Search Parameters:');
  console.log('  useHybridSearch: true/false (default: true)');
  console.log('  enableReranking: true/false (default: false)');
  console.log('  alpha: 0.7 (semantic weight, default)');
  console.log('  beta: 0.3 (BM25 weight, default)');
  console.log('  normalizationMethod: "minmax"|"softmax"|"none" (default: "minmax")');
});

export default app;
