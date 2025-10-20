import postgresqlConfig from '../config/postgresql.js';

/**
 * PostgreSQL Analytics Repository
 * Handles all analytics data operations for Discord Community Support Agent
 */
export class AnalyticsRepository {
  constructor() {
    this.postgresql = postgresqlConfig;
  }

  /**
   * Save a question to analytics
   * @param {Object} questionData - Question data
   * @returns {Promise<Object>} Saved question
   */
  async saveQuestion(questionData) {
    try {
      const {
        query,
        category,
        confidenceScore,
        searchMethod,
        sessionId,
        serverContext
      } = questionData;

      const result = await this.postgresql.query(`
        INSERT INTO questions (query, category, confidence_score, search_method, session_id, server_context)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [query, category, confidenceScore, searchMethod, sessionId, JSON.stringify(serverContext)]);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Failed to save question:', error.message);
      throw error;
    }
  }

  /**
   * Save feedback data
   * @param {Object} feedbackData - Feedback data
   * @returns {Promise<Object>} Saved feedback
   */
  async saveFeedback(feedbackData) {
    try {
      const {
        sessionId,
        query,
        responseId,
        feedbackType,
        feedbackReason
      } = feedbackData;

      const result = await this.postgresql.query(`
        INSERT INTO feedback (session_id, query, response_id, feedback_type, feedback_reason)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [sessionId, query, responseId, feedbackType, feedbackReason]);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Failed to save feedback:', error.message);
      throw error;
    }
  }

  /**
   * Save escalation event
   * @param {Object} escalationData - Escalation data
   * @returns {Promise<Object>} Saved escalation
   */
  async saveEscalation(escalationData) {
    try {
      const {
        sessionId,
        query,
        confidenceScore,
        escalationReason
      } = escalationData;

      const result = await this.postgresql.query(`
        INSERT INTO escalation_events (session_id, query, confidence_score, escalation_reason)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [sessionId, query, confidenceScore, escalationReason]);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Failed to save escalation:', error.message);
      throw error;
    }
  }

  /**
   * Update question pattern frequency
   * @param {string} patternType - Type of pattern
   * @param {Object} patternData - Pattern data
   * @returns {Promise<Object>} Updated pattern
   */
  async updateQuestionPattern(patternType, patternData) {
    try {
      // Check if pattern exists
      const existingPattern = await this.postgresql.query(`
        SELECT * FROM question_patterns 
        WHERE pattern_type = $1 AND pattern_data = $2
      `, [patternType, JSON.stringify(patternData)]);

      if (existingPattern.rows.length > 0) {
        // Update existing pattern
        const result = await this.postgresql.query(`
          UPDATE question_patterns 
          SET frequency = frequency + 1, last_seen = CURRENT_TIMESTAMP
          WHERE pattern_type = $1 AND pattern_data = $2
          RETURNING *
        `, [patternType, JSON.stringify(patternData)]);

        return result.rows[0];
      } else {
        // Create new pattern
        const result = await this.postgresql.query(`
          INSERT INTO question_patterns (pattern_type, pattern_data, frequency)
          VALUES ($1, $2, 1)
          RETURNING *
        `, [patternType, JSON.stringify(patternData)]);

        return result.rows[0];
      }
    } catch (error) {
      console.error('❌ Failed to update question pattern:', error.message);
      throw error;
    }
  }

  /**
   * Get top questions by category
   * @param {number} limit - Number of results
   * @param {string} timeRange - Time range (day, week, month)
   * @returns {Promise<Array>} Top questions
   */
  async getTopQuestionsByCategory(limit = 10, timeRange = 'week') {
    try {
      let timeFilter = '';
      switch (timeRange) {
        case 'day':
          timeFilter = "AND created_at >= CURRENT_DATE";
          break;
        case 'week':
          timeFilter = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
          break;
        case 'month':
          timeFilter = "AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
          break;
        default:
          timeFilter = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
      }

      const result = await this.postgresql.query(`
        SELECT 
          category,
          COUNT(*) as question_count,
          AVG(confidence_score) as avg_confidence,
          COUNT(DISTINCT session_id) as unique_sessions
        FROM questions 
        WHERE category IS NOT NULL ${timeFilter}
        GROUP BY category
        ORDER BY question_count DESC
        LIMIT $1
      `, [limit]);

      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get top questions by category:', error.message);
      throw error;
    }
  }

  /**
   * Get time-based patterns
   * @param {string} timeRange - Time range (day, week, month)
   * @returns {Promise<Array>} Time patterns
   */
  async getTimeBasedPatterns(timeRange = 'week') {
    try {
      let timeFilter = '';
      let groupBy = '';
      
      switch (timeRange) {
        case 'day':
          timeFilter = "AND created_at >= CURRENT_DATE";
          groupBy = "DATE_TRUNC('hour', created_at)";
          break;
        case 'week':
          timeFilter = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
          groupBy = "DATE_TRUNC('day', created_at)";
          break;
        case 'month':
          timeFilter = "AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
          groupBy = "DATE_TRUNC('day', created_at)";
          break;
        default:
          timeFilter = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
          groupBy = "DATE_TRUNC('day', created_at)";
      }

      const result = await this.postgresql.query(`
        SELECT 
          ${groupBy} as time_period,
          COUNT(*) as question_count,
          AVG(confidence_score) as avg_confidence,
          COUNT(DISTINCT session_id) as unique_sessions
        FROM questions 
        WHERE created_at IS NOT NULL ${timeFilter}
        GROUP BY ${groupBy}
        ORDER BY time_period ASC
      `);

      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get time-based patterns:', error.message);
      throw error;
    }
  }

  /**
   * Get escalation rate
   * @param {string} timeRange - Time range (day, week, month)
   * @returns {Promise<Object>} Escalation statistics
   */
  async getEscalationRate(timeRange = 'week') {
    try {
      let timeFilter = '';
      switch (timeRange) {
        case 'day':
          timeFilter = "AND created_at >= CURRENT_DATE";
          break;
        case 'week':
          timeFilter = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
          break;
        case 'month':
          timeFilter = "AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
          break;
        default:
          timeFilter = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
      }

      const result = await this.postgresql.query(`
        SELECT 
          COUNT(*) as total_questions,
          COUNT(CASE WHEN confidence_score < 0.5 THEN 1 END) as escalated_questions,
          ROUND(
            COUNT(CASE WHEN confidence_score < 0.5 THEN 1 END)::DECIMAL / 
            NULLIF(COUNT(*), 0) * 100, 2
          ) as escalation_rate_percent,
          AVG(confidence_score) as avg_confidence
        FROM questions 
        WHERE created_at IS NOT NULL ${timeFilter}
      `);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Failed to get escalation rate:', error.message);
      throw error;
    }
  }

  /**
   * Get feedback statistics
   * @param {string} timeRange - Time range (day, week, month)
   * @returns {Promise<Object>} Feedback statistics
   */
  async getFeedbackStats(timeRange = 'week') {
    try {
      let timeFilter = '';
      switch (timeRange) {
        case 'day':
          timeFilter = "AND created_at >= CURRENT_DATE";
          break;
        case 'week':
          timeFilter = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
          break;
        case 'month':
          timeFilter = "AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
          break;
        default:
          timeFilter = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
      }

      const result = await this.postgresql.query(`
        SELECT 
          COUNT(*) as total_feedback,
          COUNT(CASE WHEN feedback_type = 'positive' THEN 1 END) as positive_feedback,
          COUNT(CASE WHEN feedback_type = 'negative' THEN 1 END) as negative_feedback,
          ROUND(
            COUNT(CASE WHEN feedback_type = 'positive' THEN 1 END)::DECIMAL / 
            NULLIF(COUNT(*), 0) * 100, 2
          ) as positive_rate_percent
        FROM feedback 
        WHERE created_at IS NOT NULL ${timeFilter}
      `);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Failed to get feedback stats:', error.message);
      throw error;
    }
  }

  /**
   * Get comprehensive analytics summary
   * @param {string} timeRange - Time range (day, week, month)
   * @returns {Promise<Object>} Analytics summary
   */
  async getAnalyticsSummary(timeRange = 'week') {
    try {
      const [
        topCategories,
        timePatterns,
        escalationStats,
        feedbackStats
      ] = await Promise.all([
        this.getTopQuestionsByCategory(5, timeRange),
        this.getTimeBasedPatterns(timeRange),
        this.getEscalationRate(timeRange),
        this.getFeedbackStats(timeRange)
      ]);

      return {
        timeRange,
        topCategories,
        timePatterns,
        escalationStats,
        feedbackStats,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to get analytics summary:', error.message);
      throw error;
    }
  }

  /**
   * Update daily analytics summary
   * @param {string} date - Date (YYYY-MM-DD)
   * @returns {Promise<Object>} Updated summary
   */
  async updateDailySummary(date = new Date().toISOString().split('T')[0]) {
    try {
      const [
        topCategories,
        escalationStats,
        feedbackStats
      ] = await Promise.all([
        this.getTopQuestionsByCategory(10, 'day'),
        this.getEscalationRate('day'),
        this.getFeedbackStats('day')
      ]);

      const result = await this.postgresql.query(`
        INSERT INTO analytics_summary (
          date, total_questions, avg_confidence, escalation_rate, 
          positive_feedback_rate, top_categories
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (date) 
        DO UPDATE SET 
          total_questions = EXCLUDED.total_questions,
          avg_confidence = EXCLUDED.avg_confidence,
          escalation_rate = EXCLUDED.escalation_rate,
          positive_feedback_rate = EXCLUDED.positive_feedback_rate,
          top_categories = EXCLUDED.top_categories,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [
        date,
        escalationStats.total_questions,
        escalationStats.avg_confidence,
        escalationStats.escalation_rate_percent,
        feedbackStats.positive_rate_percent,
        JSON.stringify(topCategories)
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Failed to update daily summary:', error.message);
      throw error;
    }
  }

  /**
   * Get connection status
   * @returns {Object} Connection status
   */
  getStatus() {
    return this.postgresql.getStatus();
  }
}

// Export singleton instance
export default new AnalyticsRepository();
