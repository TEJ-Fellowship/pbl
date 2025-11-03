/**
 * MailChimp Support Agent API Service
 * Frontend service to interact with the backend API
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

class SupportAgentService {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
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
