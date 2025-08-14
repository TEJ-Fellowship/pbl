import axios from "axios";
import config from "../config/config";

const api = axios.create({
  baseURL: config.API_BASE_URL || "http://localhost:5000",
  withCredentials: true, // This is important for cookies
});

export const chatApi = {
  // Create new conversation
  createConversation: async (topic) => {
    const response = await api.post("/api/chat/conversation", { topic });
    return response.data;
  },

  // Send message
  sendMessage: async (conversationId, message) => {
    const response = await api.post("/api/chat/message", {
      conversationId,
      message,
    });
    return response.data;
  },

  // Get all conversations for current user
  getConversations: async () => {
    const response = await api.get("/api/chat/conversations");
    return response.data;
  },

  // Get specific conversation
  getConversation: async (conversationId) => {
    const response = await api.get(`/api/chat/conversations/${conversationId}`);
    return response.data;
  },

  // Delete conversation
  deleteConversation: async (conversationId) => {
    const response = await api.delete(
      `/api/chat/conversations/${conversationId}`
    );
    return response.data;
  },

  // Generate quiz from conversation
  generateQuiz: async (conversationId) => {
    const response = await api.post("/api/chat/generate-quiz", {
      conversationId,
    });
    return response.data;
  },
};
