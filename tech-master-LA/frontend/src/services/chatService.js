// tech-master-LA/frontend/src/services/chatService.js
import axios from "axios";
import config from "../config/config";

const { API_BASE_URL } = config;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for debugging
api.interceptors.request.use((request) => {
  console.log("Request:", request.method, request.url, request.data);
  return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log("Response:", response.status, response.data);
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

class ChatService {
  async sendMessage(conversationId, message) {
    try {
      // Input validation
      if (!conversationId) {
        throw new Error("conversationId is required");
      }

      if (!message || typeof message !== "string") {
        throw new Error("message must be a non-empty string");
      }

      // Log the request data
      console.log("Sending message request:", {
        conversationId,
        message,
        endpoint: `/chat/message`,
      });

      // Use the api instance instead of axios directly
      const response = await api.post("/chat/message", {
        conversationId,
        message,
      });

      // Log successful response
      console.log("Message response received:", response.data);

      // Check for success flag
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || "Request failed");
      }

      // Extract data from the response
      const { data } = response.data;

      // Return the successful response
      return {
        success: true,
        data: {
          message: data.message,
          conversation: data.conversation,
        },
      };
    } catch (error) {
      // Enhanced error logging
      const errorDetails = {
        status: error.response?.status,
        error: error.response?.data?.error || error.message,
        data: error.response?.data,
        requestData: {
          conversationId,
          message,
        },
      };
      console.error("Send message error:", errorDetails);

      return {
        success: false,
        error: errorDetails.error || "Failed to send message",
      };
    }
  }

  async createConversation(userId, topic) {
    try {
      if (!userId) {
        throw new Error("userId is required");
      }

      console.log("Creating conversation:", { userId, topic });

      const response = await api.post("/chat/conversation", {
        userId,
        topic: topic || "General",
      });

      console.log("Conversation created:", response.data);

      if (!response.data || !response.data._id) {
        throw new Error("Invalid conversation response format");
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Create conversation error:", {
        status: error.response?.status,
        error: error.response?.data?.error || error.message,
        data: error.response?.data,
      });

      return {
        success: false,
        error: error.response?.data?.error || "Failed to create conversation",
      };
    }
  }

  async generateQuiz(conversationId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/generate-quiz`, {
        conversationId,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error generating quiz:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to generate quiz",
      };
    }
  }

  async getAllConversations(userId = null) {
    try {
      const url = userId
        ? `${API_BASE_URL}/chat/users/${userId}/conversations`
        : `${API_BASE_URL}/chat/conversations`;
      const response = await axios.get(url);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch conversations",
      };
    }
  }

  async getConversationById(conversationId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/chat/conversations/${conversationId}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching conversation:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch conversation",
      };
    }
  }

  async deleteConversation(conversationId) {
    try {
      await axios.delete(
        `${API_BASE_URL}/chat/conversations/${conversationId}`
      );
      console.log("Conversation deleted(from service):", conversationId);
      return { success: true };
    } catch (error) {
      console.error("Error deleting conversation:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete conversation",
      };
    }
  }
}

export default new ChatService();
