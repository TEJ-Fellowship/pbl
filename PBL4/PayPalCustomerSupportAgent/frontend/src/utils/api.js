// API utility functions

const API_BASE_URL = "http://localhost:5000/api";

/**
 * Send a query to the backend
 */
export const sendQuery = async (question, sessionId) => {
  const response = await fetch(`${API_BASE_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, sessionId }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Get chat history for a session
 */
export const getChatHistory = async (sessionId, limit = 100) => {
  const response = await fetch(
    `${API_BASE_URL}/chat/history/${sessionId}?limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
