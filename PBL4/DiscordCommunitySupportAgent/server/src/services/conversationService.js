import { saveConversation, getConversationHistory, connectToMongoDB, saveUserProfile, getUserProfile, updateUserProfile } from '../repositories/conversationRepository.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';

/**
 * Conversation Service - Handles conversation management and AI responses
 */
class ConversationService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.gemini.model });
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('💬 Initializing Conversation Service...');
      await connectToMongoDB();
      this.isInitialized = true;
      console.log('✅ Conversation Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Conversation Service initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Extract user information from query
   * @param {string} query - User query
   * @returns {Object} Extracted user information
   */
  extractUserInfo(query) {
    const userInfo = {};
    
    // Extract name patterns
    const namePatterns = [
      /my name is (\w+)/i,
      /i am (\w+)/i,
      /call me (\w+)/i,
      /i'm (\w+)/i,
      /i'm called (\w+)/i,
      /my name's (\w+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = query.match(pattern);
      if (match) {
        userInfo.name = match[1];
        break;
      }
    }
    
    // Extract other preferences
    if (query.toLowerCase().includes('prefer') || query.toLowerCase().includes('like')) {
      // Could extract preferences here
    }
    
    return userInfo;
  }

  /**
   * Generate AI response using RAG with Discord-style formatting
   * @param {string} query - User query
   * @param {Array} retrievedDocs - Retrieved documents
   * @param {Object} serverContext - Server context information
   * @param {Object} userProfile - User profile information
   * @returns {Promise<string>} AI-generated response
   */
  async generateRAGAnswer(query, retrievedDocs, serverContext = {}, userProfile = {}) {
    try {
      const context = retrievedDocs.map((doc, index) => 
        `Source ${index + 1} (${doc.metadata.source}):\n${doc.content}\n`
      ).join('\n');

      const serverType = serverContext.type || 'general';
      const serverSize = serverContext.size || 'unknown';
      const userName = userProfile.name || 'there';

      const prompt = `You are a Discord Community Support Agent. Answer this question based on the Discord documentation provided.

User Question: ${query}
User Context: ${userName ? `The user's name is ${userName}` : 'No user name provided'}
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

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
      
    } catch (error) {
      console.error("Error generating answer:", error.message);
      return "I apologize, but I'm having trouble generating an answer right now.";
    }
  }

  /**
   * Process a complete conversation turn
   * @param {string} query - User query
   * @param {Array} searchResults - Search results from search service
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Complete response object
   */
  async processConversation(query, searchResults, options = {}) {
    const {
      sessionId = 'default',
      serverContext = {},
      enableReranking = false
    } = options;

    try {
      // Extract user information from query
      const extractedUserInfo = this.extractUserInfo(query);
      
      // Get existing user profile
      let userProfile = await getUserProfile(sessionId) || {};
      
      // Update user profile if new information was extracted
      if (extractedUserInfo.name && extractedUserInfo.name !== userProfile.name) {
        userProfile = { ...userProfile, ...extractedUserInfo };
        await saveUserProfile(sessionId, userProfile);
        console.log(`👤 User name updated: ${extractedUserInfo.name}`);
      }

      // Generate AI response with user context
      const answer = await this.generateRAGAnswer(query, searchResults, serverContext, userProfile);

      // Prepare response object
      const response = {
        success: true,
        query,
        answer,
        results: searchResults.map(doc => ({
          content: doc.content,
          source: doc.metadata.source,
          combinedScore: doc.similarity,
          score: doc.similarity,
          metadata: doc.metadata,
          semanticScore: doc.semanticScore,
          keywordScore: doc.keywordScore,
          crossEncoderScore: doc.crossEncoderScore
        })),
        sources: searchResults.map(doc => ({
          source: doc.metadata.source,
          similarity: doc.similarity,
          semanticScore: doc.semanticScore,
          keywordScore: doc.keywordScore,
          crossEncoderScore: doc.crossEncoderScore
        })),
        sessionId,
        searchMethod: searchResults[0]?.searchMethod || 'unknown',
        features: {
          hybridSearch: true,
          reranking: enableReranking,
          serverContext: Object.keys(serverContext).length > 0
        },
        timestamp: new Date().toISOString()
      };

      // Save conversation to database (async, don't wait)
      this.saveConversationAsync(sessionId, query, searchResults, serverContext);

      return response;

    } catch (error) {
      console.error('❌ Conversation processing failed:', error.message);
      return {
        success: false,
        query,
        answer: "I apologize, but I'm having trouble processing your request right now.",
        results: [],
        sources: [],
        sessionId,
        searchMethod: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Save conversation asynchronously (don't block response)
   * @param {string} sessionId - Session identifier
   * @param {string} query - User query
   * @param {Array} results - Search results
   * @param {Object} serverContext - Server context
   */
  async saveConversationAsync(sessionId, query, results, serverContext) {
    try {
      await saveConversation(sessionId, query, results, {
        serverContext,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('⚠️ Failed to save conversation:', error.message);
      // Don't throw - this is not critical for the response
    }
  }

  /**
   * Get conversation history for a session
   * @param {string} sessionId - Session identifier
   * @param {number} limit - Number of recent conversations to retrieve
   * @returns {Promise<Array>} Conversation history
   */
  async getConversationHistory(sessionId, limit = 10) {
    try {
      return await getConversationHistory(sessionId, limit);
    } catch (error) {
      console.error('❌ Failed to get conversation history:', error.message);
      return [];
    }
  }

  /**
   * Format response for different output types
   * @param {Object} response - Response object
   * @param {string} format - Output format ('json', 'text', 'discord')
   * @returns {string|Object} Formatted response
   */
  formatResponse(response, format = 'json') {
    switch (format) {
      case 'text':
        return response.answer;
      
      case 'discord':
        return {
          content: response.answer,
          embeds: response.sources.map(source => ({
            title: `Source: ${source.source}`,
            description: source.similarity ? `Similarity: ${(source.similarity * 100).toFixed(1)}%` : '',
            color: 0x5865F2 // Discord blue
          }))
        };
      
      case 'json':
      default:
        return response;
    }
  }
}

// Export singleton instance
export default new ConversationService();
