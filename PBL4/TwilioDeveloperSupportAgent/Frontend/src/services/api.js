// API service for communicating with the Twilio Developer Support Agent backend
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for AI responses
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(
      `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("❌ API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(
      "❌ API Response Error:",
      error.response?.data || error.message
    );

    // Handle different error types
    if (error.response?.status === 500) {
      throw new Error("Server error. Please try again later.");
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.error || "Invalid request.");
    } else if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout. The AI is taking too long to respond.");
    } else if (!error.response) {
      throw new Error("Network error. Please check your connection.");
    }

    throw error;
  }
);

// Health check
export const checkHealth = async () => {
  try {
    const response = await api.get("/health");
    return response.data;
  } catch (error) {
    console.error("Health check failed:", error);
    throw error;
  }
};

// Send message to chat API
export const sendMessage = async (query, sessionId = "default") => {
  try {
    const response = await api.post("/chat", {
      query: query.trim(),
      sessionId,
    });
    return response.data;
  } catch (error) {
    console.error("Send message failed:", error);
    throw error;
  }
};

// Get conversation history
export const getConversationHistory = async (sessionId = "default") => {
  try {
    const response = await api.get(`/conversation/${sessionId}`);
    return response.data.history || [];
  } catch (error) {
    console.error("Get conversation history failed:", error);
    // Return empty array if no history exists
    return [];
  }
};

// Clear conversation history
export const clearConversation = async (sessionId = "default") => {
  try {
    const response = await api.delete(`/conversation/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error("Clear conversation failed:", error);
    throw error;
  }
};

// Get user preferences
export const getUserPreferences = async (sessionId = "default") => {
  try {
    const response = await api.get(`/preferences/${sessionId}`);
    return response.data.preferences || {};
  } catch (error) {
    console.error("Get user preferences failed:", error);
    return {};
  }
};

// MCP Tools API functions
export const getMCPTools = async () => {
  try {
    const response = await api.get("/mcp/tools");
    return response.data;
  } catch (error) {
    console.error("Get MCP tools failed:", error);
    throw error;
  }
};

export const callMCPTool = async (tool, args = {}) => {
  try {
    const response = await api.post("/mcp/tools", {
      tool,
      args,
    });
    return response.data;
  } catch (error) {
    console.error(`MCP tool ${tool} failed:`, error);
    throw error;
  }
};

// Convenience functions for specific MCP tools
export const enhanceChatContext = async (query, context = "") => {
  return callMCPTool("enhance_chat_context", { query, context });
};

export const validateTwilioCode = async (code, language = "javascript") => {
  return callMCPTool("validate_twilio_code", { code, language });
};

export const lookupErrorCode = async (errorCode) => {
  return callMCPTool("lookup_error_code", { errorCode });
};

export const detectProgrammingLanguage = async (text) => {
  return callMCPTool("detect_programming_language", { text });
};

export const searchWeb = async (query, maxResults = 5) => {
  return callMCPTool("web_search", { query, maxResults });
};

export const checkTwilioStatus = async (service = null) => {
  return callMCPTool("check_twilio_status", { service });
};

export const validateWebhookSignature = async (signature, url, payload, authToken) => {
  return callMCPTool("validate_webhook_signature", { signature, url, payload, authToken });
};

export const calculateRateLimits = async (apiType, requestsPerSecond, requestsPerMinute, accountTier = "pay-as-you-go") => {
  return callMCPTool("calculate_rate_limits", { apiType, requestsPerSecond, requestsPerMinute, accountTier });
};

export const executeTwilioCode = async (code, language = "nodejs", testMode = true) => {
  return callMCPTool("execute_twilio_code", { code, language, testMode });
};

export default api;
