// API Configuration
// If VITE_API_URL is empty string or not set, use relative paths (same domain)
// Otherwise, use the provided URL (for development or separate frontend)
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  // Empty string means use relative paths (same domain)
  if (envUrl === "" || envUrl === undefined) {
    return ""; // Relative path - same domain
  }
  // Use provided URL (for development with separate frontend server)
  return envUrl;
};

export const API_CONFIG = {
  BASE_URL: getBaseURL() || "http://localhost:5000",
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// API Endpoints
export const API_ENDPOINTS = {
  HEALTH: "/api/health",
  STATUS: "/api/health/status",
  CHAT: "/api/chat",
  SESSION: "/api/chat/session",
  HISTORY: "/api/chat/history",
  SESSIONS: "/api/chat/sessions",
  SESSION_DETAILS: "/api/chat/sessions",
  INTEGRATED_CHAT: "/api/integrated-chat",
  MCP_STATUS: "/api/integrated-chat/mcp-status",
  CLASSIFIER_STATUS: "/api/integrated-chat/classifier-status",
  INTEGRATED_HEALTH: "/api/integrated-chat/health",
};

// Default values
export const DEFAULT_VALUES = {
  // USER_ID is now obtained from authentication context
  SESSION_CONTEXT: {
    project: "stripe_support",
    context: "customer_support",
  },
  MESSAGE_LIMIT: 50,
  MESSAGE_OFFSET: 0,
};

// Default export for easy importing
const API_BASE_URL = API_CONFIG.BASE_URL;
export default API_BASE_URL;
