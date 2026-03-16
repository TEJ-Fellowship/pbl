// tech-master-LA/backend/controllers/chatController.js
const chatService = require("../services/chatService");
const Conversation = require("../models/chatModel");

const createConversation = async (req, res) => {
  try {
    const { topic } = req.body;
    const userId = req.user.id; // Get user ID from auth middleware

    const conversation = new Conversation({
      userId,
      topic: topic || "General",
      messages: [],
    });

    const savedConversation = await conversation.save();
    res.status(201).json({
      success: true,
      data: savedConversation,
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create conversation",
    });
  }
};

const getAllConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await chatService.getAllConversations(userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch conversations",
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    // The frontend sends conversationId in the body, not params
    const { conversationId, message } = req.body;

    if (!conversationId) {
      return res.status(400).json({ error: "conversationId is required" });
    }

    if (!message) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const result = await chatService.sendMessage(conversationId, message);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      message: result.data.message,
      updatedTopic: result.updatedTopic,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateQuizFromContext = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const result = await chatService.generateQuiz(conversationId);

    if (!result.success) {
      return res
        .status(result.error === "Conversation not found" ? 404 : 400)
        .json({ error: result.error });
    }

    // Return the saved quiz with proper structure
    res.status(201).json({
      success: true,
      quiz: result.quiz,
    });
  } catch (error) {
    console.error("Generate quiz error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const result = await chatService.getConversationById(conversationId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error,
      });
    }

    // Check if the conversation belongs to the user
    if (result.conversation.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    res.json({
      success: true,
      data: result.conversation,
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch conversation",
    });
  }
};

const getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await chatService.getUserConversations(userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // First check if the conversation belongs to the user
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
      });
    }

    const result = await chatService.deleteConversation(conversationId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete conversation",
    });
  }
};

module.exports = {
  createConversation,
  sendMessage,
  generateQuizFromContext,
  getAllConversations,
  getConversationById,
  getUserConversations,
  deleteConversation,
};
