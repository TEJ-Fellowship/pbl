import { API_CONFIG, API_ENDPOINTS, DEFAULT_VALUES } from "../config/api.js";

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Make HTTP request with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || "GET";

    // Log outgoing request
    console.log(`📤 ${method} ${endpoint}`);

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        console.log(`❌ ${method} ${endpoint} - ${response.status}`);
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      console.log(`✅ ${method} ${endpoint} - ${response.status}`);
      return data;
    } catch (error) {
      console.log(`💥 ${method} ${endpoint} - ${error.message}`);
      throw error;
    }
  }

  /**
   * Send a message to the chat API
   */
  async sendMessage(
    message,
    sessionId = null,
    userId = DEFAULT_VALUES.USER_ID
  ) {
    return this.request(API_ENDPOINTS.CHAT, {
      method: "POST",
      body: JSON.stringify({
        message,
        sessionId,
        userId,
      }),
    });
  }

  /**
   * Get conversation history for a session
   */
  async getHistory(
    sessionId,
    limit = DEFAULT_VALUES.MESSAGE_LIMIT,
    offset = DEFAULT_VALUES.MESSAGE_OFFSET
  ) {
    return this.request(
      `${API_ENDPOINTS.HISTORY}/${sessionId}?limit=${limit}&offset=${offset}`
    );
  }

  /**
   * Create a new chat session
   */
  async createSession(
    userId = DEFAULT_VALUES.USER_ID,
    context = DEFAULT_VALUES.SESSION_CONTEXT
  ) {
    return this.request(API_ENDPOINTS.SESSION, {
      method: "POST",
      body: JSON.stringify({
        userId,
        context,
      }),
    });
  }

  /**
   * Delete a chat session
   */
  async deleteSession(sessionId) {
    return this.request(`${API_ENDPOINTS.SESSION}/${sessionId}`, {
      method: "DELETE",
    });
  }

  /**
   * Get system health status
   */
  async getHealth() {
    return this.request(API_ENDPOINTS.HEALTH);
  }

  /**
   * Get detailed system status
   */
  async getStatus() {
    return this.request(API_ENDPOINTS.STATUS);
  }

  /**
   * Get session token usage
   */
  async getTokenUsage(sessionId) {
    return this.request(`/api/chat/tokens/${sessionId}`);
  }

  /**
   * Update session token limit
   */
  async updateTokenLimit(sessionId, maxTokens) {
    return this.request(`/api/chat/tokens/${sessionId}`, {
      method: "PUT",
      body: JSON.stringify({ maxTokens }),
    });
  }

  // ===== INTEGRATED CHAT METHODS =====

  /**
   * Send a message using the integrated chat system (full backend functionality)
   */
  async sendIntegratedMessage(
    message,
    sessionId,
    userId = DEFAULT_VALUES.USER_ID
  ) {
    return this.request(API_ENDPOINTS.INTEGRATED_CHAT, {
      method: "POST",
      body: JSON.stringify({
        message,
        sessionId,
        userId,
      }),
    });
  }

  /**
   * Get MCP system status
   */
  async getMCPStatus() {
    return this.request(API_ENDPOINTS.MCP_STATUS);
  }

  /**
   * Get query classifier status
   */
  async getClassifierStatus() {
    return this.request(API_ENDPOINTS.CLASSIFIER_STATUS);
  }

  /**
   * Get integrated system health
   */
  async getIntegratedHealth() {
    return this.request(API_ENDPOINTS.INTEGRATED_HEALTH);
  }

  // ===== SESSION MANAGEMENT METHODS =====

  /**
   * Get all conversation sessions for a user
   */
  async getAllSessions(
    userId = DEFAULT_VALUES.USER_ID,
    limit = 50,
    offset = 0
  ) {
    return this.request(
      `${API_ENDPOINTS.SESSIONS}?userId=${userId}&limit=${limit}&offset=${offset}`
    );
  }

  /**
   * Get detailed information about a specific session
   */
  async getSessionDetails(sessionId) {
    return this.request(`${API_ENDPOINTS.SESSION_DETAILS}/${sessionId}`);
  }
}

// Export singleton instance
export const apiService = new ApiService();
