// tech-master-LA/backend/services/chatService.js
const Conversation = require("../models/chatModel");
const geminiService = require("./geminiService");
const Quiz = require("../models/quizModel");

const mapRoleToGemini = (role) => {
  // Map 'assistant' to 'model' for Gemini API
  return role === "assistant" ? "model" : role;
};

const mapRoleFromGemini = (role) => {
  // Map 'model' back to 'assistant' for frontend
  return role === "model" ? "assistant" : role;
};

class ChatService {
  async createConversation(userId, topic) {
    try {
      const conversation = new Conversation({
        userId,
        topic,
        messages: [],
      });
      await conversation.save();
      return { success: true, conversation };
    } catch (error) {
      console.error("Create Conversation Error:", error);
      return { success: false, error: error.message };
    }
  }

  async sendMessage(conversationId, message) {
    try {
      console.log("Processing message in chat service:", {
        conversationId,
        message,
      });

      if (!message || typeof message !== "string") {
        return {
          success: false,
          error: "Message is required and must be a string",
          statusCode: 400,
        };
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return {
          success: false,
          error: "Conversation not found",
          statusCode: 404,
        };
      }

      let updatedTopic = null;
      // Check if it's the first message and the topic is the default one
      if (
        conversation.messages.length === 0 &&
        (conversation.topic === "New Chat" || !conversation.topic)
      ) {
        // Generate a new topic from the first message
        updatedTopic = await geminiService.generateChatTopic(message);
        conversation.topic = updatedTopic;
      }

      // Get existing messages
      const existingMessages = conversation.messages || [];

      // Add user message to conversation
      const userMessage = {
        role: "user",
        displayRole: "user",
        content: message,
      };

      // Get AI response using Gemini service
      const aiResponse = await geminiService.sendChatMessage(
        existingMessages,
        message
      );

      if (!aiResponse.success) {
        throw new Error(aiResponse.error);
      }

      // Add both messages to conversation
      conversation.messages.push(userMessage);
      conversation.messages.push({
        role: "model",
        displayRole: "assistant",
        content: aiResponse.data,
      });

      // Manually update the 'updatedAt' timestamp
      conversation.updatedAt = new Date();

      // Save updated conversation
      await conversation.save();

      return {
        success: true,
        data: {
          message: aiResponse.data,
          conversation: conversation.toObject(),
        },
        updatedTopic: updatedTopic,
      };
    } catch (error) {
      console.error("Send Message Error:", error);
      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode || 500,
      };
    }
  }

  async generateQuiz(conversationId) {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return { success: false, error: "Conversation not found" };
      }

      // Make sure there are enough messages for a meaningful quiz
      if (!conversation.messages || conversation.messages.length < 2) {
        return {
          success: false,
          error: "Not enough conversation context to generate a quiz",
        };
      }

      const context = conversation.messages
        .map((msg) => `${msg.displayRole}: ${msg.content}`)
        .join("\n");

      const result = await geminiService.generateQuizFromContext(context);

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Failed to generate quiz",
        };
      }
      // Transform the Gemini quiz format to match your Quiz model format
      const formattedQuestions = result.quiz.questions.map((q) => ({
        question: q.question,
        options: q.options,
        correct: q.correctAnswer,
      }));

      // Create a new quiz using your Quiz model
      const newQuiz = new Quiz({
        userId: conversation.userId,
        title: conversation.topic || "Chat Generated Quiz",
        topic: conversation.topic || "Chat Generated",
        questions: formattedQuestions,
        attempts: [],
      });

      // Save the quiz to database
      const savedQuiz = await newQuiz.save();

      return {
        success: true,
        quiz: savedQuiz,
      };
    } catch (error) {
      console.error("Generate Quiz Error:", error);
      return { success: false, error: error.message };
    }
  }

  async getAllConversations(userId = null) {
    try {
      // If userId is provided, get conversations for that user
      // Otherwise, get all conversations
      const query = userId ? { userId } : {};

      const conversations = await Conversation.find(query)
        .sort({ updatedAt: -1 }) // Sort by most recent first
        .select({
          _id: 1,
          userId: 1,
          topic: 1,
          createdAt: 1,
          updatedAt: 1,
        });

      return {
        success: true,
        data: conversations,
      };
    } catch (error) {
      console.error("Get All Conversations Error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getConversationById(conversationId) {
    try {
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return {
          success: false,
          error: "Conversation not found",
        };
      }

      return {
        success: true,
        conversation,
      };
    } catch (error) {
      console.error("Get Conversation Error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getUserConversations(userId) {
    try {
      const conversations = await Conversation.find({ userId })
        .sort({ updatedAt: -1 })
        .select("-messages"); // Don't include messages for list view

      return {
        success: true,
        conversations,
      };
    } catch (error) {
      console.error("Get User Conversations Error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deleteConversation(conversationId) {
    try {
      const conversation = await Conversation.findByIdAndDelete(conversationId);

      if (!conversation) {
        return {
          success: false,
          error: "Conversation not found",
        };
      }

      return {
        success: true,
        message: "Conversation deleted successfully",
      };
    } catch (error) {
      console.error("Delete Conversation Error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new ChatService();
