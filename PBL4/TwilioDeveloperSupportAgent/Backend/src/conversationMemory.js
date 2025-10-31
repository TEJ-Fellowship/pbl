// backend/src/conversationMemory.js
import fs from "fs/promises";
import path from "path";

/**
 * Conversation Memory System
 *
 * This module manages conversation state, user preferences, and context
 * to enable intelligent multi-turn conversations with the Twilio support agent.
 *
 * Key Features:
 * - Tracks user's programming language preference
 * - Remembers API being used (SMS, Voice, Video, etc.)
 * - Stores conversation history for context
 * - Maintains session state across interactions
 * - Provides intelligent context injection for responses
 */

class ConversationMemory {
  constructor(sessionId = "default") {
    this.sessionId = sessionId;
    this.memoryPath = path.join(
      process.cwd(),
      "data",
      "conversation_memory.json"
    );
    this.memory = {
      sessions: {},
      globalPreferences: {
        defaultLanguage: null,
        preferredAPI: null,
        lastUsedLanguage: null,
        lastUsedAPI: null,
      },
    };
  }

  /**
   * Initialize memory system by loading existing data
   */
  async initialize() {
    try {
      await fs.mkdir(path.dirname(this.memoryPath), { recursive: true });

      try {
        const data = await fs.readFile(this.memoryPath, "utf-8");
        this.memory = JSON.parse(data);
      } catch (error) {
        // File doesn't exist or is invalid, start fresh
        console.log("📝 Initializing new conversation memory...");
        await this.saveMemory();
      }

      // Initialize session if it doesn't exist
      if (!this.memory.sessions[this.sessionId]) {
        this.memory.sessions[this.sessionId] = {
          id: this.sessionId,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          conversationHistory: [],
          userPreferences: {
            language: null,
            api: null,
            context: [],
          },
          currentContext: {
            topic: null,
            relatedAPIs: [],
            errorCodes: [],
            lastQuery: null,
          },
        };
        await this.saveMemory();
      }

      console.log(
        `🧠 Conversation memory initialized for session: ${this.sessionId}`
      );
      return true;
    } catch (error) {
      console.error(
        "❌ Failed to initialize conversation memory:",
        error.message
      );
      return false;
    }
  }

  /**
   * Save memory to disk
   */
  async saveMemory() {
    try {
      await fs.writeFile(this.memoryPath, JSON.stringify(this.memory, null, 2));
    } catch (error) {
      console.error("❌ Failed to save conversation memory:", error.message);
    }
  }

  /**
   * Get session data for a specific sessionId
   * @param {string} sessionId - Session ID (uses this.sessionId if not provided)
   */
  getSession(sessionId = null) {
    const sid = sessionId || this.sessionId;
    return this.memory.sessions[sid] || null;
  }

  /**
   * Get current session data (uses this.sessionId)
   */
  getCurrentSession() {
    return this.getSession();
  }

  /**
   * Ensure a session exists for a given sessionId
   * @param {string} sessionId - Session ID to ensure exists
   */
  async ensureSession(sessionId) {
    if (!sessionId) sessionId = this.sessionId;

    if (!this.memory.sessions[sessionId]) {
      this.memory.sessions[sessionId] = {
        id: sessionId,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        conversationHistory: [],
        userPreferences: {
          language: null,
          api: null,
          context: [],
        },
        currentContext: {
          topic: null,
          relatedAPIs: [],
          errorCodes: [],
          lastQuery: null,
        },
      };
      await this.saveMemory();
    }
    return this.memory.sessions[sessionId];
  }

  /**
   * Update user's programming language preference
   * @param {string} language - Detected or user-specified language
   */
  async updateLanguagePreference(language) {
    const session = this.getCurrentSession();
    if (!session) return;

    session.userPreferences.language = language;
    session.lastActivity = new Date().toISOString();

    // Update global preferences
    this.memory.globalPreferences.lastUsedLanguage = language;
    if (!this.memory.globalPreferences.defaultLanguage) {
      this.memory.globalPreferences.defaultLanguage = language;
    }

    await this.saveMemory();
    console.log(`💻 Language preference updated to: ${language}`);
  }

  /**
   * Update user's API preference
   * @param {string} api - Detected or user-specified API (sms, voice, video, etc.)
   */
  async updateAPIPreference(api) {
    const session = this.getCurrentSession();
    if (!session) return;

    session.userPreferences.api = api;
    session.lastActivity = new Date().toISOString();

    // Update global preferences
    this.memory.globalPreferences.lastUsedAPI = api;
    if (!this.memory.globalPreferences.preferredAPI) {
      this.memory.globalPreferences.preferredAPI = api;
    }

    await this.saveMemory();
    console.log(`🔧 API preference updated to: ${api}`);
  }

  /**
   * Add a conversation turn to history
   * @param {string} query - User's question
   * @param {string} response - AI's response
   * @param {Object} metadata - Additional context (error codes, language, etc.)
   * @param {string} sessionId - Session ID (optional, uses this.sessionId if not provided)
   */
  async addConversationTurn(query, response, metadata = {}, sessionId = null) {
    const sid = sessionId || this.sessionId;
    const session = await this.ensureSession(sid);

    const conversationTurn = {
      timestamp: new Date().toISOString(),
      query: query,
      response: response,
      metadata: {
        detectedLanguage: metadata.language || null,
        detectedAPI: metadata.api || null,
        errorCodes: metadata.errorCodes || [],
        chunkCount: metadata.chunkCount || 0,
        responseTime: metadata.responseTime || 0,
      },
    };

    session.conversationHistory.push(conversationTurn);
    session.lastActivity = new Date().toISOString();

    // Keep only last 20 conversation turns to prevent memory bloat
    if (session.conversationHistory.length > 20) {
      session.conversationHistory = session.conversationHistory.slice(-20);
    }

    await this.saveMemory();
  }

  /**
   * Update current conversation context
   * @param {Object} context - Current context information
   */
  async updateCurrentContext(context) {
    const session = this.getCurrentSession();
    if (!session) return;

    session.currentContext = {
      ...session.currentContext,
      ...context,
      lastUpdated: new Date().toISOString(),
    };

    await this.saveMemory();
  }

  /**
   * Get conversation context for response generation
   * @param {string} sessionId - Session ID (optional, uses this.sessionId if not provided)
   * @returns {Object} Context object with user preferences and recent history
   */
  getConversationContext(sessionId = null) {
    const sid = sessionId || this.sessionId;
    const session = this.getSession(sid);
    if (!session) {
      return {
        userPreferences: {},
        currentContext: {},
        recentHistory: [],
        topics: [],
        commonErrorCodes: [],
        languagePatterns: [],
        sessionDuration: 0,
      };
    }

    // Get recent conversation history (last 5 turns)
    const recentHistory = session.conversationHistory?.slice(-5) || [];

    // Extract common topics and patterns
    const topics = this.extractTopics(recentHistory);
    const commonErrorCodes = this.extractCommonErrorCodes(recentHistory);
    const languagePatterns = this.extractLanguagePatterns(recentHistory);

    return {
      userPreferences: session.userPreferences || {},
      currentContext: session.currentContext || {},
      recentHistory: recentHistory,
      topics: topics,
      commonErrorCodes: commonErrorCodes,
      languagePatterns: languagePatterns,
      sessionDuration: this.calculateSessionDuration(session),
    };
  }

  /**
   * Extract common topics from conversation history
   * @param {Array} history - Conversation history
   * @returns {Array} Array of common topics
   */
  extractTopics(history) {
    const topicKeywords = {
      sms: ["sms", "message", "text", "notification"],
      voice: ["voice", "call", "phone", "audio"],
      video: ["video", "room", "meeting", "stream"],
      webhooks: ["webhook", "callback", "event", "notification"],
      authentication: ["auth", "token", "key", "credential"],
      errors: ["error", "exception", "fail", "issue"],
      setup: ["setup", "install", "configure", "initialize"],
      testing: ["test", "debug", "verify", "check"],
    };

    const topicCounts = {};
    history.forEach((turn) => {
      const query = turn.query.toLowerCase();
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        keywords.forEach((keyword) => {
          if (query.includes(keyword)) {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
          }
        });
      });
    });

    return Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);
  }

  /**
   * Extract common error codes from conversation history
   * @param {Array} history - Conversation history
   * @returns {Array} Array of common error codes
   */
  extractCommonErrorCodes(history) {
    const errorCodes = new Set();
    history.forEach((turn) => {
      if (turn.metadata.errorCodes) {
        turn.metadata.errorCodes.forEach((code) => errorCodes.add(code));
      }
    });
    return Array.from(errorCodes);
  }

  /**
   * Extract language patterns from conversation history
   * @param {Array} history - Conversation history
   * @returns {Object} Language usage patterns
   */
  extractLanguagePatterns(history) {
    const languageCounts = {};
    history.forEach((turn) => {
      const lang = turn.metadata.detectedLanguage;
      if (lang) {
        languageCounts[lang] = (languageCounts[lang] || 0) + 1;
      }
    });
    return languageCounts;
  }

  /**
   * Calculate session duration
   * @param {Object} session - Session data
   * @returns {number} Duration in minutes
   */
  calculateSessionDuration(session) {
    const start = new Date(session.createdAt);
    const now = new Date();
    return Math.round((now - start) / (1000 * 60));
  }

  /**
   * Generate context-aware prompt prefix
   * @param {string} query - Current user query
   * @returns {string} Context-aware prompt prefix
   */
  generateContextPrompt(query) {
    const context = this.getConversationContext();
    let contextPrompt = "";

    // Add user preferences
    if (context.userPreferences?.language) {
      contextPrompt += `\nUSER PREFERENCE: The user prefers ${context.userPreferences.language} programming language. `;
    }

    if (context.userPreferences?.api) {
      contextPrompt += `The user is primarily working with ${context.userPreferences.api.toUpperCase()} API. `;
    }

    // Add recent topics
    if (context.topics?.length > 0) {
      contextPrompt += `\nRECENT TOPICS: The user has been asking about ${context.topics.join(
        ", "
      )}. `;
    }

    // Add common error codes
    if (context.commonErrorCodes?.length > 0) {
      contextPrompt += `\nCOMMON ERROR CODES: The user has encountered these error codes: ${context.commonErrorCodes.join(
        ", "
      )}. `;
    }

    // Add conversation continuity
    if (context.recentHistory?.length > 0) {
      const lastQuery =
        context.recentHistory[context.recentHistory.length - 1].query;
      contextPrompt += `\nCONVERSATION CONTEXT: The user's previous question was about "${lastQuery}". `;
    }

    // Add session duration
    if (context.sessionDuration > 0) {
      contextPrompt += `\nSESSION INFO: This is an ongoing conversation (${context.sessionDuration} minutes). `;
    }

    return contextPrompt;
  }

  /**
   * Clear conversation history for a session
   * @param {string} sessionId - Session ID (optional, uses this.sessionId if not provided)
   */
  async clearConversationHistory(sessionId = null) {
    const sid = sessionId || this.sessionId;
    const session = this.getSession(sid);
    if (!session) return;

    session.conversationHistory = [];
    session.currentContext = {
      topic: null,
      relatedAPIs: [],
      errorCodes: [],
      lastQuery: null,
    };

    await this.saveMemory();
    console.log(`🗑️ Session history cleared for session: ${sid}`);
  }

  /**
   * Clear conversation history for current session (alias for backward compatibility)
   */
  async clearSessionHistory() {
    await this.clearConversationHistory();
  }

  /**
   * Get memory statistics
   * @returns {Object} Memory usage statistics
   */
  getMemoryStats() {
    const session = this.getCurrentSession();
    if (!session) return {};

    return {
      sessionId: this.sessionId,
      conversationTurns: session.conversationHistory.length,
      sessionDuration: this.calculateSessionDuration(session),
      userPreferences: session.userPreferences,
      currentContext: session.currentContext,
      totalSessions: Object.keys(this.memory.sessions).length,
    };
  }

  /**
   * Return the last `n` turns (default 6) in the session's history
   * Useful for feeding recent conversation into MCP
   */
  getRecentTurns(n = 6) {
    const session = this.getCurrentSession();
    if (!session) return [];
    // Convert stored turn format (timestamp, query, response, metadata) into simple object
    return (session.conversationHistory || []).slice(-n).map((t) => ({
      timestamp: t.timestamp,
      query: t.query,
      response: t.response,
      metadata: t.metadata || {},
    }));
  }

  /**
   * Return user's preferences for a session (language, api, etc.)
   * @param {string} sessionId - Session ID (optional, uses this.sessionId if not provided)
   */
  getUserPreferences(sessionId = null) {
    const sid = sessionId || this.sessionId;
    const session = this.getSession(sid);
    if (!session) return {};
    return session.userPreferences || {};
  }

  /**
   * Get all sessions (for testing/debugging)
   * @returns {Array} Array of session information
   */
  getAllSessions() {
    return Object.keys(this.memory.sessions || {}).map((sid) => {
      const session = this.getSession(sid);
      return {
        id: sid,
        createdAt: session?.createdAt || null,
        lastActivity: session?.lastActivity || null,
        messageCount: session?.conversationHistory?.length || 0,
        preferences: session?.userPreferences || {},
      };
    });
  }

  /**
   * Small wrapper to store assistant or user turn using existing addConversationTurn
   * turn: { role: 'user'|'assistant', content: '...' }
   */
  async storeTurn(turn) {
    if (!turn) return;
    if (turn.role === "assistant") {
      await this.addConversationTurn(turn.query || "", turn.content || "", {
        language: turn.metadata?.language,
        api: turn.metadata?.api,
        errorCodes: turn.metadata?.errorCodes || [],
        chunkCount: turn.metadata?.chunkCount || 0,
        responseTime: turn.metadata?.responseTime || 0,
      });
    } else if (turn.role === "user") {
      // For user turns, we can add with empty response
      await this.addConversationTurn(turn.content || "", "", {
        language: turn.metadata?.language,
        api: turn.metadata?.api,
        errorCodes: turn.metadata?.errorCodes || [],
      });
    }
  }
}

export default ConversationMemory;
