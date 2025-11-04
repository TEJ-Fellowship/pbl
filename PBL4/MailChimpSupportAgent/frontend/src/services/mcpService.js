/**
 * MailChimp Support Agent API Service
 * Frontend service to interact with the backend API
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

class SupportAgentService {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.sessionId = this.getOrCreateSessionId();
  }

  /**
   * Generate a UUID v4 (for PostgreSQL UUID compatibility)
   */
  generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  /**
   * Validate if a string is a valid UUID
   */
  isValidUUID(uuid) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Get or create a unique session ID for conversation memory
   */
  getOrCreateSessionId() {
    let sessionId = localStorage.getItem("mailchimp_session_id");

    // Validate existing session ID - if invalid, clear it
    if (sessionId && !this.isValidUUID(sessionId)) {
      console.warn(
        `⚠️ Invalid session ID found: ${sessionId}. Generating new UUID...`
      );
      localStorage.removeItem("mailchimp_session_id");
      sessionId = null;
    }

    if (!sessionId) {
      // Generate a proper UUID for PostgreSQL compatibility
      sessionId = this.generateUUID();
      localStorage.setItem("mailchimp_session_id", sessionId);
      console.log(`✅ Generated new session ID: ${sessionId}`);
    }

    return sessionId;
  }

  /**
   * Reset the session ID (start a new conversation)
   */
  resetSession() {
    const sessionId = this.generateUUID();
    localStorage.setItem("mailchimp_session_id", sessionId);
    this.sessionId = sessionId;
    return sessionId;
  }

  /**
   * Initialize or resume a session
   */
  async initializeSession(userId = "web-user") {
    try {
      const response = await fetch(`${this.baseUrl}/api/session/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          userId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(
        `Session ${data.resumed ? "resumed" : "initialized"}: ${data.sessionId}`
      );
      console.log(`Previous messages: ${data.messages || 0}`);

      return data;
    } catch (error) {
      console.error("Session initialization failed:", error);
      throw error;
    }
  }

  /**
   * Check if the API service is available
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("API health check failed:", error);
      return { status: "unavailable", error: error.message };
    }
  }

  /**
   * Get system status
   */
  async getStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/api/status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Get status failed:", error);
      throw error;
    }
  }

  /**
   * Ask a question to the support agent
   */
  async askQuestion(question) {
    try {
      const response = await fetch(`${this.baseUrl}/api/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          sessionId: this.sessionId, // Include session ID for memory tracking
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      // Validate response structure
      if (!data || typeof data !== "object") {
        throw new Error("Invalid response format from server");
      }

      if (data.status === "error") {
        throw new Error(data.message || "Server returned an error");
      }

      // Ensure required fields exist with defaults
      return {
        status: data.status || "success",
        response:
          data.response ||
          "I apologize, but I couldn't generate a response. Please try again.",
        sources: Array.isArray(data.sources) ? data.sources : [],
        classification: data.classification || {
          category: "unknown",
          confidence: 0,
          approach: "HYBRID_SEARCH",
        },
        toolUsed: data.toolUsed || null,
        confidence: data.confidence || null,
        isGreeting: data.isGreeting || false,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error("Ask question failed:", error);
      throw error;
    }
  }
}

// Create singleton instance
const supportAgentService = new SupportAgentService();

export default supportAgentService;
export { SupportAgentService };
