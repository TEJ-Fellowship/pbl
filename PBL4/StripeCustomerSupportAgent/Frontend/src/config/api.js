// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:5000",
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
  INTEGRATED_CHAT: "/api/integrated-chat",
  MCP_STATUS: "/api/integrated-chat/mcp-status",
  CLASSIFIER_STATUS: "/api/integrated-chat/classifier-status",
  INTEGRATED_HEALTH: "/api/integrated-chat/health",
};

// Default values
export const DEFAULT_VALUES = {
  USER_ID: "web_user",
  SESSION_CONTEXT: {
    project: "stripe_support",
    context: "customer_support",
  },
  MESSAGE_LIMIT: 50,
  MESSAGE_OFFSET: 0,
};
