// tech-master-LA/frontend/src/services/chatService.js
import axios from "axios";
import config from "../config/config";

const { API_BASE_URL } = config;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
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
        endpoint: `/api/chat/message`,
      });

      // Use the api instance instead of axios directly
      const response = await api.post("/api/chat/message", {
        conversationId,
        message,
      });

      // Log successful response
      console.log("Message response received:", response.data);

      // Check for success flag
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || "Request failed");
      }

      // The entire `response.data` object is what we need
      const responseData = response.data;

      // Return the successful response, now structured correctly
      return {
        success: true,
        data: {
          message: responseData.message,
          updatedTopic: responseData.updatedTopic, // Pass the topic along
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

  async createConversation(topic) {
    try {
      console.log("Creating conversation:", { topic });

      const response = await api.post("/api/chat/conversation", {
        topic: topic || "General",
      });

      console.log("Conversation created:", response.data);

      if (!response.data || !response.data.data || !response.data.data._id) {
        throw new Error("Invalid conversation response format");
      }

      return { success: true, data: response.data.data };
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
      const response = await api.post("/api/chat/generate-quiz", {
        conversationId,
      });

      console.log("Generate quiz response:", response.data);

      // The backend returns { success: true, quiz: savedQuiz }
      if (response.data && response.data.success && response.data.quiz) {
        return { success: true, data: response.data.quiz };
      } else {
        return { success: false, error: "Invalid quiz response" };
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to generate quiz",
      };
    }
  }

  async getAllConversations() {
    try {
      const response = await api.get("/api/chat/conversations");

      if (!response.data || !response.data.success) {
        throw new Error(
          response.data?.error || "Failed to fetch conversations"
        );
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch conversations",
      };
    }
  }

  async getConversation(conversationId) {
    try {
      const response = await api.get(
        `/api/chat/conversations/${conversationId}`
      );

      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || "Failed to fetch conversation");
      }

      return { success: true, data: response.data.data };
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
      const response = await api.delete(
        `/api/chat/conversations/${conversationId}`
      );

      if (!response.data || !response.data.success) {
        throw new Error(
          response.data?.error || "Failed to delete conversation"
        );
      }

      return { success: true, data: response.data };
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
