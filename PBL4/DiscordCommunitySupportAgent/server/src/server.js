import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from './config/index.js';
import searchService from './services/searchService.js';
import conversationService from './services/conversationService.js';
import analyticsService from './services/analyticsService.js';
import postgresqlConfig from './config/postgresql.js';
import { validateQuery, validateServerContext, validateSearchOptions, validateSessionId } from './utils/validators.js';
import { getUserProfile, saveUserProfile } from './repositories/conversationRepository.js';
import { formatErrorMessage } from './utils/formatters.js';

// Load environment variables (allow later values to override existing)
dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
let searchServiceReady = false;
let conversationServiceReady = false;
let analyticsServiceReady = false;
let postgresqlReady = false;

async function initializeServices() {
  try {
    console.log('🔧 Initializing services...');
    
    // Initialize PostgreSQL first
    postgresqlReady = await postgresqlConfig.initialize();
    
    // Initialize search service
    searchServiceReady = await searchService.initialize();
    
    // Initialize conversation service
    conversationServiceReady = await conversationService.initialize();
    
    // Initialize analytics service (depends on PostgreSQL)
    analyticsServiceReady = await analyticsService.initialize();
    
    console.log(`✅ PostgreSQL: ${postgresqlReady ? 'Ready' : 'Failed'}`);
    console.log(`✅ Search Service: ${searchServiceReady ? 'Ready' : 'Failed'}`);
    console.log(`✅ Conversation Service: ${conversationServiceReady ? 'Ready' : 'Failed'}`);
    console.log(`✅ Analytics Service: ${analyticsServiceReady ? 'Ready' : 'Failed'}`);
    
  } catch (error) {
    console.error('❌ Service initialization failed:', error.message);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not configured',
    features: {
      searchService: searchServiceReady,
      conversationService: conversationServiceReady,
      analyticsService: analyticsServiceReady,
      postgresql: postgresqlReady,
      hybridSearch: searchServiceReady,
      reranking: true,
      semanticSearch: true,
      conversationMemory: conversationServiceReady,
      mcpTools: conversationServiceReady,
      analytics: analyticsServiceReady
    },
    searchMethods: searchService.getStatus(),
    analytics: analyticsService.getStatus()
  });
});

// Main search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query, sessionId, serverContext = {}, searchOptions = {} } = req.body;
    
    // Validate inputs
    const queryValidation = validateQuery(query);
    if (!queryValidation.isValid) {
      return res.status(400).json({ 
        error: queryValidation.error,
        success: false 
      });
    }

    const contextValidation = validateServerContext(serverContext);
    const optionsValidation = validateSearchOptions(searchOptions);
    
    const sanitizedQuery = queryValidation.sanitized;
    const sanitizedContext = contextValidation.sanitized;
    const sanitizedOptions = optionsValidation.sanitized;
    
    console.log(`🔍 Searching for: "${sanitizedQuery}"`);
    
    // Perform search
    const searchResults = await searchService.search(sanitizedQuery, {
      method: sanitizedOptions.method,
      limit: sanitizedOptions.limit,
      semanticWeight: sanitizedOptions.semanticWeight,
      keywordWeight: sanitizedOptions.keywordWeight,
      enableReranking: sanitizedOptions.enableReranking
    });
    
    if (searchResults.length === 0) {
      return res.json({
        success: true,
        query: sanitizedQuery,
        answer: "I couldn't find relevant information about that topic. Please try rephrasing your question.",
        results: [],
        sources: [],
        sessionId: sessionId || 'default',
        searchMethod: sanitizedOptions.method,
        features: {
          hybridSearch: searchServiceReady,
          reranking: sanitizedOptions.enableReranking,
          serverContext: Object.keys(sanitizedContext).length > 0
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Process conversation
    const response = await conversationService.processConversation(
      sanitizedQuery, 
      searchResults, 
      {
        sessionId: sessionId || 'default',
        serverContext: sanitizedContext,
        enableReranking: sanitizedOptions.enableReranking
      }
    );

    // Track analytics (async, don't wait)
    if (analyticsServiceReady) {
      analyticsService.trackQuestion({
        query: sanitizedQuery,
        searchResults,
        confidenceScore: response.confidenceScore || 0.8,
        searchMethod: sanitizedOptions.method,
        sessionId: sessionId || 'default',
        serverContext: sanitizedContext
      }).catch(error => {
        console.error('❌ Analytics tracking failed:', error.message);
      });
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Search error:', error.message);
    res.status(500).json({ 
      error: 'Search failed', 
      success: false,
      message: formatErrorMessage(error, 'search')
    });
  }
});

// Server context endpoint
app.post('/api/server-context', (req, res) => {
  try {
    const { sessionId, serverType, serverSize, purpose } = req.body;
    
    const contextValidation = validateServerContext({
      type: serverType,
      size: serverSize,
      purpose: purpose
    });
    
    if (!contextValidation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid server context',
        success: false 
      });
    }
    
    const sanitizedContext = contextValidation.sanitized;
    
    console.log(`📝 Server context updated for ${sessionId}: ${sanitizedContext.type} server (${sanitizedContext.size} members) - ${sanitizedContext.purpose}`);
    
    res.json({
      success: true,
      sessionId: sessionId || 'default',
      serverContext: {
        ...sanitizedContext,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Server context error:', error.message);
    res.status(500).json({ 
      error: 'Failed to update server context',
      success: false,
      message: formatErrorMessage(error, 'server context')
    });
  }
});

// Conversation history endpoint
app.get('/api/conversations/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 10 } = req.query;
    
    const sessionValidation = validateSessionId(sessionId);
    if (!sessionValidation.isValid) {
      return res.status(400).json({ 
        error: sessionValidation.error,
        success: false 
      });
    }
    
    const conversations = await conversationService.getConversationHistory(
      sessionValidation.sanitized, 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      sessionId: sessionValidation.sanitized,
      conversations,
      count: conversations.length
    });
    
  } catch (error) {
    console.error('❌ Conversation history error:', error.message);
    res.status(500).json({ 
      error: 'Failed to retrieve conversation history',
      success: false,
      message: formatErrorMessage(error, 'conversation history')
    });
  }
});

// User profile endpoints
app.get('/api/user/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const sessionValidation = validateSessionId(sessionId);
    if (!sessionValidation.isValid) {
      return res.status(400).json({ 
        error: sessionValidation.error,
        success: false 
      });
    }
    
    const userProfile = await getUserProfile(sessionValidation.sanitized);
    
    res.json({
      success: true,
      sessionId: sessionValidation.sanitized,
      userProfile: userProfile || {},
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ User profile error:', error.message);
    res.status(500).json({ 
      error: 'Failed to retrieve user profile',
      success: false,
      message: formatErrorMessage(error, 'user profile')
    });
  }
});

app.post('/api/user/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { name, preferences, ...otherData } = req.body;
    
    const sessionValidation = validateSessionId(sessionId);
    if (!sessionValidation.isValid) {
      return res.status(400).json({ 
        error: sessionValidation.error,
        success: false 
      });
    }
    
    const userData = { name, preferences, ...otherData };
    const userProfile = await saveUserProfile(sessionValidation.sanitized, userData);
    
    res.json({
      success: true,
      sessionId: sessionValidation.sanitized,
      userProfile: userProfile || {},
      message: 'User profile updated successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ User profile update error:', error.message);
    res.status(500).json({ 
      error: 'Failed to update user profile',
      success: false,
      message: formatErrorMessage(error, 'user profile update')
    });
  }
});

// Search statistics endpoint
app.get('/api/stats', (req, res) => {
  try {
    const searchStatus = searchService.getStatus();
    const analyticsStatus = analyticsService.getStatus();
    
    res.json({
      success: true,
      search: searchStatus,
      analytics: analyticsStatus,
      features: {
        hybridSearch: searchServiceReady,
        reranking: true,
        semanticSearch: true,
        conversationMemory: true,
        analytics: analyticsServiceReady,
        postgresql: postgresqlReady
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Stats error:', error.message);
    res.status(500).json({ 
      error: 'Failed to retrieve statistics',
      success: false,
      message: formatErrorMessage(error, 'statistics')
    });
  }
});

// Analytics endpoints
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const { timeRange = 'week' } = req.query;
    
    if (!analyticsServiceReady) {
      return res.status(503).json({
        success: false,
        error: 'Analytics service not available'
      });
    }

    const result = await analyticsService.getAnalyticsSummary(timeRange);
    
    res.json({
      success: result.success,
      summary: result.summary,
      error: result.error,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Analytics summary error:', error.message);
    res.status(500).json({ 
      error: 'Failed to retrieve analytics summary',
      success: false,
      message: formatErrorMessage(error, 'analytics summary')
    });
  }
});

app.get('/api/analytics/top-questions', async (req, res) => {
  try {
    const { limit = 10, timeRange = 'week' } = req.query;
    
    if (!analyticsServiceReady) {
      return res.status(503).json({
        success: false,
        error: 'Analytics service not available'
      });
    }

    const result = await analyticsService.getTopQuestionsByCategory(parseInt(limit), timeRange);
    
    res.json({
      success: result.success,
      questions: result.questions,
      error: result.error,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Top questions error:', error.message);
    res.status(500).json({ 
      error: 'Failed to retrieve top questions',
      success: false,
      message: formatErrorMessage(error, 'top questions')
    });
  }
});

app.get('/api/analytics/escalation-stats', async (req, res) => {
  try {
    const { timeRange = 'week' } = req.query;
    
    if (!analyticsServiceReady) {
      return res.status(503).json({
        success: false,
        error: 'Analytics service not available'
      });
    }

    const result = await analyticsService.getEscalationStats(timeRange);
    
    res.json({
      success: result.success,
      stats: result.stats,
      error: result.error,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Escalation stats error:', error.message);
    res.status(500).json({ 
      error: 'Failed to retrieve escalation statistics',
      success: false,
      message: formatErrorMessage(error, 'escalation statistics')
    });
  }
});

app.get('/api/analytics/feedback-stats', async (req, res) => {
  try {
    const { timeRange = 'week' } = req.query;
    
    if (!analyticsServiceReady) {
      return res.status(503).json({
        success: false,
        error: 'Analytics service not available'
      });
    }

    const result = await analyticsService.getFeedbackStats(timeRange);
    
    res.json({
      success: result.success,
      stats: result.stats,
      error: result.error,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Feedback stats error:', error.message);
    res.status(500).json({ 
      error: 'Failed to retrieve feedback statistics',
      success: false,
      message: formatErrorMessage(error, 'feedback statistics')
    });
  }
});

// Feedback endpoint
app.post('/api/feedback', async (req, res) => {
  try {
    const { sessionId, query, responseId, feedbackType, feedbackReason } = req.body;
    
    // Validate inputs
    if (!sessionId || !query || !feedbackType) {
      return res.status(400).json({
        success: false,
        error: 'Session ID, query, and feedback type are required'
      });
    }

    if (!['positive', 'negative'].includes(feedbackType)) {
      return res.status(400).json({
        success: false,
        error: 'Feedback type must be "positive" or "negative"'
      });
    }

    if (!analyticsServiceReady) {
      return res.status(503).json({
        success: false,
        error: 'Analytics service not available'
      });
    }

    const result = await analyticsService.trackFeedback({
      sessionId,
      query,
      responseId,
      feedbackType,
      feedbackReason
    });
    
    res.json({
      success: result.success,
      feedbackId: result.feedbackId,
      error: result.error,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Feedback error:', error.message);
    res.status(500).json({ 
      error: 'Failed to save feedback',
      success: false,
      message: formatErrorMessage(error, 'feedback')
    });
  }
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, email, serverType, serverSize, purpose } = req.body;
    
    // Validate inputs
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        error: 'Username and email are required'
      });
    }
    
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

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, serverType, serverSize, purpose } = req.body;
    
    // Validate inputs
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        error: 'Username and email are required'
      });
    }
    
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: formatErrorMessage(error, 'server')
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log('🚀 Discord Community Support RAG Server Started!');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
  
  // Initialize services
  await initializeServices();
  
  console.log('\n📋 Available endpoints:');
  console.log('  GET  /api/health - Health check');
  console.log('  POST /api/search - RAG search with hybrid search');
  console.log('  POST /api/server-context - Update server context');
  console.log('  POST /api/auth/login - User login');
  console.log('  POST /api/auth/signup - User registration');
  console.log('  GET  /api/conversations/:sessionId - Get conversation history');
  console.log('  GET  /api/user/:sessionId - Get user profile');
  console.log('  POST /api/user/:sessionId - Update user profile');
  console.log('  GET  /api/stats - Get system statistics');
  console.log('  GET  /api/analytics/summary - Analytics summary');
  console.log('  GET  /api/analytics/top-questions - Top questions by category');
  console.log('  GET  /api/analytics/escalation-stats - Escalation statistics');
  console.log('  GET  /api/analytics/feedback-stats - Feedback statistics');
  console.log('  POST /api/feedback - Submit feedback');
  console.log('\n✨ Features:');
  console.log('  🔀 Hybrid Search: Semantic + BM25 keyword search');
  console.log('  🤖 AI Answers: Gemini-generated responses');
  console.log('  📝 Discord Markdown: Proper formatting');
  console.log('  🎯 Server Context: Gaming/study/community awareness');
  console.log('  💾 Conversation Memory: MongoDB storage');
  console.log('  🔄 Cross-encoder Re-ranking: Optional');
  console.log('  📊 Analytics: PostgreSQL analytics tracking');
  console.log('  👍 Feedback: Thumbs up/down system');
});

export default app;