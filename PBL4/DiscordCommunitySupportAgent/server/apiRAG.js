import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import { searchSimilarDocuments } from './chroma/chromaClient.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// MongoDB connection
let mongoClient;
let db;

async function connectToMongoDB() {
  try {
    mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();
    db = mongoClient.db(process.env.MONGODB_DB || 'discord_support');
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Generate AI answer using RAG
async function generateRAGAnswer(query, retrievedDocs) {
  try {
    // Prepare context from retrieved documents
    const context = retrievedDocs.map((doc, index) => 
      `Source ${index + 1} (${doc.metadata.source}):\n${doc.content}\n`
    ).join('\n');

    // Create a prompt for Gemini to generate a comprehensive answer
    const prompt = `You are a Discord Community Support Agent. Based on the following context from Discord documentation, provide a helpful, accurate, and comprehensive answer to the user's question.

User Question: ${query}

Context from Discord Documentation:
${context}

Instructions:
1. Provide a clear, helpful answer based on the context above
2. If the context doesn't contain enough information, say so politely
3. Use Discord-specific terminology correctly
4. Be concise but thorough
5. If there are step-by-step instructions, present them clearly
6. Use Discord emojis appropriately (⚙️, 🔒, ➕, etc.)

Answer:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Error generating answer:", error.message);
    return "I apologize, but I'm having trouble generating an answer right now. Please try again.";
  }
}

// Save conversation to MongoDB
async function saveConversation(sessionId, query, answer, sources, metadata = {}) {
  try {
    if (!db) return;
    
    const conversation = {
      sessionId,
      query,
      answer,
      sources: sources.map(source => ({
        source: source.metadata.source,
        chunkIndex: source.metadata.chunkIndex,
        similarity: source.similarity,
        content: source.content.substring(0, 200) + '...' // Truncate for storage
      })),
      timestamp: new Date(),
      metadata: {
        ...metadata,
        model: 'gemini-2.5-flash',
        ragEnabled: true
      }
    };
    
    await db.collection('conversations').insertOne(conversation);
    console.log(`📝 Saved conversation for session: ${sessionId}`);
    
  } catch (error) {
    console.error('Error saving conversation:', error.message);
  }
}

// Get conversation history
async function getConversationHistory(sessionId, limit = 10) {
  try {
    if (!db) return [];
    
    const conversations = await db.collection('conversations')
      .find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    return conversations.reverse(); // Return in chronological order
    
  } catch (error) {
    console.error('Error getting conversation history:', error.message);
    return [];
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mongodb: db ? 'connected' : 'disconnected',
    gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not configured'
  });
});

// Main search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query, sessionId, limit = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Query is required',
        success: false 
      });
    }
    
    console.log(`🔍 Searching for: "${query}" (session: ${sessionId || 'anonymous'})`);
    
    // Step 1: Retrieve relevant documents
    const results = await searchSimilarDocuments(query, limit);
    
    if (!results.documents || results.documents.length === 0) {
      return res.json({
        success: true,
        query,
        answer: "I couldn't find relevant information about that topic in the Discord documentation. Please try rephrasing your question or ask about Discord server management, permissions, bots, or other Discord features.",
        sources: [],
        sessionId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Step 2: Prepare retrieved documents
    const retrievedDocs = results.documents[0].map((doc, index) => ({
      content: doc,
      metadata: results.metadatas[0][index],
      similarity: 1 - results.distances[0][index]
    }));
    
    // Step 3: Generate AI answer
    console.log('🤖 Generating AI answer...');
    const answer = await generateRAGAnswer(query, retrievedDocs);
    
    // Step 4: Save conversation if sessionId provided
    if (sessionId) {
      await saveConversation(sessionId, query, answer, retrievedDocs);
    }
    
    // Step 5: Return response
    res.json({
      success: true,
      query,
      answer,
      sources: retrievedDocs.map(doc => ({
        source: doc.metadata.source,
        chunkIndex: doc.metadata.chunkIndex,
        similarity: doc.similarity,
        fileName: doc.metadata.fileName
      })),
      sessionId,
      timestamp: new Date().toISOString(),
      metadata: {
        totalSources: retrievedDocs.length,
        avgSimilarity: (retrievedDocs.reduce((sum, doc) => sum + doc.similarity, 0) / retrievedDocs.length).toFixed(3),
        model: 'gemini-2.5-flash'
      }
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

// Get conversation history endpoint
app.get('/api/conversations/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 10 } = req.query;
    
    const history = await getConversationHistory(sessionId, parseInt(limit));
    
    res.json({
      success: true,
      sessionId,
      conversations: history,
      total: history.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting conversation history:', error.message);
    res.status(500).json({ 
      error: 'Failed to get conversation history',
      success: false 
    });
  }
});

// Get all sessions endpoint
app.get('/api/sessions', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'MongoDB not connected' });
    }
    
    const sessions = await db.collection('conversations')
      .aggregate([
        {
          $group: {
            _id: '$sessionId',
            lastQuery: { $last: '$query' },
            lastTimestamp: { $max: '$timestamp' },
            messageCount: { $sum: 1 }
          }
        },
        { $sort: { lastTimestamp: -1 } },
        { $limit: 50 }
      ])
      .toArray();
    
    res.json({
      success: true,
      sessions,
      total: sessions.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting sessions:', error.message);
    res.status(500).json({ 
      error: 'Failed to get sessions',
      success: false 
    });
  }
});

// Delete conversation endpoint
app.delete('/api/conversations/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!db) {
      return res.status(503).json({ error: 'MongoDB not connected' });
    }
    
    const result = await db.collection('conversations')
      .deleteMany({ sessionId });
    
    res.json({
      success: true,
      sessionId,
      deletedCount: result.deletedCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error deleting conversation:', error.message);
    res.status(500).json({ 
      error: 'Failed to delete conversation',
      success: false 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    success: false,
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    success: false,
    availableEndpoints: [
      'GET /api/health',
      'POST /api/search',
      'GET /api/conversations/:sessionId',
      'GET /api/sessions',
      'DELETE /api/conversations/:sessionId'
    ]
  });
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    const mongoConnected = await connectToMongoDB();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log('🚀 Discord Community Support API Server Started!');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`📊 MongoDB: ${mongoConnected ? 'Connected' : 'Disconnected'}`);
      console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
      console.log('\n📋 Available endpoints:');
      console.log('  GET  /api/health - Health check');
      console.log('  POST /api/search - Search with RAG');
      console.log('  GET  /api/conversations/:sessionId - Get conversation history');
      console.log('  GET  /api/sessions - Get all sessions');
      console.log('  DELETE /api/conversations/:sessionId - Delete conversation');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  if (mongoClient) {
    await mongoClient.close();
    console.log('✅ MongoDB connection closed');
  }
  process.exit(0);
});

// Start the server
startServer();
