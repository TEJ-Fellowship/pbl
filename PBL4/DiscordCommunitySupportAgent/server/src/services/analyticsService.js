import analyticsRepository from '../repositories/analyticsRepository.js';

/**
 * Analytics Service
 * Handles analytics tracking and pattern analysis for Discord Community Support Agent
 */
class AnalyticsService {
  constructor() {
    this.repository = analyticsRepository;
    this.isInitialized = false;
  }

  /**
   * Initialize analytics service
   */
  async initialize() {
    try {
      console.log('📊 Initializing Analytics Service...');
      
      // Check if PostgreSQL is available
      const status = this.repository.getStatus();
      if (!status.initialized) {
        console.log('⚠️ PostgreSQL not initialized, analytics will be disabled');
        return false;
      }

      this.isInitialized = true;
      console.log('✅ Analytics Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Analytics Service:', error.message);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Track a question for analytics
   * @param {Object} questionData - Question data
   * @returns {Promise<Object>} Tracking result
   */
  async trackQuestion(questionData) {
    if (!this.isInitialized) {
      console.log('⚠️ Analytics not initialized, skipping question tracking');
      return { success: false, reason: 'Analytics not initialized' };
    }

    try {
      const {
        query,
        searchResults = [],
        confidenceScore,
        searchMethod = 'hybrid',
        sessionId,
        serverContext = {}
      } = questionData;

      // Classify query category
      const category = this.classifyQuery(query, searchResults);

      // Save question to analytics
      const savedQuestion = await this.repository.saveQuestion({
        query,
        category,
        confidenceScore,
        searchMethod,
        sessionId,
        serverContext
      });

      // Update question patterns
      await this.updateQuestionPatterns(query, category, serverContext);

      // Check for escalation
      if (confidenceScore < 0.5) {
        await this.trackEscalation({
          sessionId,
          query,
          confidenceScore,
          escalationReason: 'Low confidence score'
        });
      }

      return {
        success: true,
        questionId: savedQuestion.id,
        category,
        escalated: confidenceScore < 0.5
      };
    } catch (error) {
      console.error('❌ Failed to track question:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track feedback
   * @param {Object} feedbackData - Feedback data
   * @returns {Promise<Object>} Tracking result
   */
  async trackFeedback(feedbackData) {
    if (!this.isInitialized) {
      console.log('⚠️ Analytics not initialized, skipping feedback tracking');
      return { success: false, reason: 'Analytics not initialized' };
    }

    try {
      const {
        sessionId,
        query,
        responseId,
        feedbackType, // 'positive' or 'negative'
        feedbackReason
      } = feedbackData;

      const savedFeedback = await this.repository.saveFeedback({
        sessionId,
        query,
        responseId,
        feedbackType,
        feedbackReason
      });

      return {
        success: true,
        feedbackId: savedFeedback.id
      };
    } catch (error) {
      console.error('❌ Failed to track feedback:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track escalation event
   * @param {Object} escalationData - Escalation data
   * @returns {Promise<Object>} Tracking result
   */
  async trackEscalation(escalationData) {
    if (!this.isInitialized) {
      console.log('⚠️ Analytics not initialized, skipping escalation tracking');
      return { success: false, reason: 'Analytics not initialized' };
    }

    try {
      const savedEscalation = await this.repository.saveEscalation(escalationData);
      
      return {
        success: true,
        escalationId: savedEscalation.id
      };
    } catch (error) {
      console.error('❌ Failed to track escalation:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Classify query into categories
   * @param {string} query - User query
   * @param {Array} searchResults - Search results
   * @returns {string} Query category
   */
  classifyQuery(query, searchResults = []) {
    const queryLower = query.toLowerCase();

    // Server setup and management
    if (this.containsKeywords(queryLower, [
      'create server', 'server setup', 'invite', 'channel', 'category',
      'server settings', 'server configuration', 'server management'
    ])) {
      return 'server_setup';
    }

    // Roles and permissions
    if (this.containsKeywords(queryLower, [
      'role', 'permission', 'admin', 'moderator', 'kick', 'ban',
      'manage', 'bitfield', 'hierarchy', 'assign role'
    ])) {
      return 'roles_permissions';
    }

    // Moderation tools
    if (this.containsKeywords(queryLower, [
      'moderation', 'mod tools', 'auto mod', 'filter', 'warn',
      'timeout', 'mute', 'deafen', 'audit log'
    ])) {
      return 'moderation';
    }

    // Bot integration
    if (this.containsKeywords(queryLower, [
      'bot', 'discord bot', 'bot token', 'bot integration',
      'slash command', 'bot setup', 'bot configuration'
    ])) {
      return 'bot_integration';
    }

    // API and webhooks
    if (this.containsKeywords(queryLower, [
      'api', 'webhook', 'discord api', 'developer', 'oauth',
      'application', 'client id', 'webhook url'
    ])) {
      return 'api_webhooks';
    }

    // Safety and privacy
    if (this.containsKeywords(queryLower, [
      'safety', 'privacy', 'report', 'block', 'dm',
      'server privacy', 'verification', 'screening'
    ])) {
      return 'safety_privacy';
    }

    // Community guidelines
    if (this.containsKeywords(queryLower, [
      'guidelines', 'rules', 'community', 'tos', 'terms',
      'policy', 'violation', 'report user'
    ])) {
      return 'community_guidelines';
    }

    // Troubleshooting
    if (this.containsKeywords(queryLower, [
      'error', 'problem', 'issue', 'not working', 'fix',
      'troubleshoot', 'help', 'support'
    ])) {
      return 'troubleshooting';
    }

    // Default category
    return 'general';
  }

  /**
   * Check if query contains any keywords
   * @param {string} queryLower - Lowercase query
   * @param {Array} keywords - Keywords to check
   * @returns {boolean} True if contains keywords
   */
  containsKeywords(queryLower, keywords) {
    return keywords.some(keyword => queryLower.includes(keyword));
  }

  /**
   * Update question patterns
   * @param {string} query - User query
   * @param {string} category - Query category
   * @param {Object} serverContext - Server context
   */
  async updateQuestionPatterns(query, category, serverContext) {
    try {
      // Track category patterns
      await this.repository.updateQuestionPattern('category', { category });

      // Track server type patterns
      if (serverContext.type) {
        await this.repository.updateQuestionPattern('server_type', { 
          type: serverContext.type 
        });
      }

      // Track server size patterns
      if (serverContext.size) {
        await this.repository.updateQuestionPattern('server_size', { 
          size: serverContext.size 
        });
      }

      // Track query length patterns
      const queryLength = query.length;
      let lengthCategory = 'short';
      if (queryLength > 100) lengthCategory = 'long';
      else if (queryLength > 50) lengthCategory = 'medium';

      await this.repository.updateQuestionPattern('query_length', { 
        category: lengthCategory,
        length: queryLength 
      });

    } catch (error) {
      console.error('❌ Failed to update question patterns:', error.message);
    }
  }

  /**
   * Get analytics summary
   * @param {string} timeRange - Time range (day, week, month)
   * @returns {Promise<Object>} Analytics summary
   */
  async getAnalyticsSummary(timeRange = 'week') {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Analytics not initialized',
        summary: null
      };
    }

    try {
      const summary = await this.repository.getAnalyticsSummary(timeRange);
      return {
        success: true,
        summary
      };
    } catch (error) {
      console.error('❌ Failed to get analytics summary:', error.message);
      return {
        success: false,
        error: error.message,
        summary: null
      };
    }
  }

  /**
   * Get top questions by category
   * @param {number} limit - Number of results
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Top questions
   */
  async getTopQuestionsByCategory(limit = 10, timeRange = 'week') {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Analytics not initialized',
        questions: []
      };
    }

    try {
      const questions = await this.repository.getTopQuestionsByCategory(limit, timeRange);
      return {
        success: true,
        questions
      };
    } catch (error) {
      console.error('❌ Failed to get top questions:', error.message);
      return {
        success: false,
        error: error.message,
        questions: []
      };
    }
  }

  /**
   * Get escalation statistics
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Escalation stats
   */
  async getEscalationStats(timeRange = 'week') {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Analytics not initialized',
        stats: null
      };
    }

    try {
      const stats = await this.repository.getEscalationRate(timeRange);
      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('❌ Failed to get escalation stats:', error.message);
      return {
        success: false,
        error: error.message,
        stats: null
      };
    }
  }

  /**
   * Get feedback statistics
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Feedback stats
   */
  async getFeedbackStats(timeRange = 'week') {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Analytics not initialized',
        stats: null
      };
    }

    try {
      const stats = await this.repository.getFeedbackStats(timeRange);
      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('❌ Failed to get feedback stats:', error.message);
      return {
        success: false,
        error: error.message,
        stats: null
      };
    }
  }

  /**
   * Update daily analytics summary
   * @returns {Promise<Object>} Update result
   */
  async updateDailySummary() {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Analytics not initialized'
      };
    }

    try {
      const summary = await this.repository.updateDailySummary();
      return {
        success: true,
        summary
      };
    } catch (error) {
      console.error('❌ Failed to update daily summary:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      repository: this.repository.getStatus()
    };
  }
}

// Export singleton instance
export default new AnalyticsService();
