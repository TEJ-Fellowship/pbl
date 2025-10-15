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
}

// Export singleton instance
export const apiService = new ApiService();
