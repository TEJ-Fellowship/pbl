import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { searchSimilarDocuments } from './chroma/chromaClient.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeHybridSearch, hybridSearch } from './utils/hybridSearch.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Initialize advanced search features
let hybridSearchReady = false;

async function initializeAdvancedSearch() {
  try {
    console.log('🔧 Initializing advanced search features...');
    
    // Initialize hybrid search (without cross-encoder)
    hybridSearchReady = await initializeHybridSearch();
    
    console.log(`✅ Hybrid search: ${hybridSearchReady ? 'Ready' : 'Failed'}`);
    console.log(`✅ Cross-encoder reranking: Disabled (using semantic + keyword only)`);
    
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
1. Provide a clear, helpful answer based on the context above
2. Use Discord-specific terminology correctly (channels, roles, permissions, etc.)
3. Format your response with Discord-style markdown:
   - Use **bold** for important terms
   - Use \`code blocks\` for commands and settings
   - Use > blockquotes for important notes
   - Use bullet points for step-by-step instructions
4. Include relevant Discord emojis (⚙️, 🔒, ➕, 📝, 🎮, etc.)
5. If there are step-by-step instructions, present them clearly
6. Be concise but thorough

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
      reranking: false, // Disabled to avoid cross-encoder issues
      semanticSearch: true
    }
  });
});

// Main search endpoint with hybrid search (no reranking)
app.post('/api/search', async (req, res) => {
  try {
    const { query, sessionId, serverContext = {}, useHybridSearch = true } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Query is required',
        success: false 
      });
    }
    
    console.log(`🔍 Searching for: "${query}" (hybrid: ${useHybridSearch && hybridSearchReady})`);
    
    let retrievedDocs = [];
    
    // Use hybrid search if available, otherwise fallback to semantic search
    if (useHybridSearch && hybridSearchReady) {
      console.log('🔀 Using hybrid search (semantic + keyword)...');
      const hybridResults = await hybridSearch(query, 5, 0.65, 0.35, false); // No reranking
      
      retrievedDocs = hybridResults.map(result => ({
        content: result.content,
        metadata: {
          source: result.source || 'unknown',
          chunkIndex: result.chunkIndex || 0,
          fileName: result.fileName || 'unknown'
        },
        similarity: result.combinedScore || result.score || 0,
        semanticScore: result.semanticScore || 0,
        keywordScore: result.keywordScore || 0,
        crossEncoderScore: 0 // No reranking
      }));
    } else {
      console.log('🔍 Using semantic search...');
      const results = await searchSimilarDocuments(query, 5);
      
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
        crossEncoderScore: 0
      }));
    }
    
    if (retrievedDocs.length === 0) {
      return res.json({
        success: true,
        query,
        answer: "I couldn't find relevant information about that topic. Please try rephrasing your question.",
        sources: [],
        sessionId,
        searchMethod: useHybridSearch && hybridSearchReady ? 'hybrid' : 'semantic'
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
        crossEncoderScore: doc.crossEncoderScore
      })),
      sources: retrievedDocs.map(doc => ({
        source: doc.metadata.source,
        similarity: doc.similarity,
        semanticScore: doc.semanticScore,
        keywordScore: doc.keywordScore,
        crossEncoderScore: doc.crossEncoderScore
      })),
      sessionId,
      searchMethod: useHybridSearch && hybridSearchReady ? 'hybrid' : 'semantic',
      features: {
        hybridSearch: hybridSearchReady,
        reranking: false,
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
  console.log('  POST /api/search - Search with RAG (hybrid + semantic, no reranking)');
  console.log('  POST /api/server-context - Update server context');
  console.log('\n✨ Features:');
  console.log('  🔀 Hybrid Search: Semantic + BM25 keyword search');
  console.log('  🤖 AI Answers: Gemini-generated responses');
  console.log('  📝 Discord Markdown: Proper formatting');
  console.log('  🎯 Server Context: Gaming/study/community awareness');
});
