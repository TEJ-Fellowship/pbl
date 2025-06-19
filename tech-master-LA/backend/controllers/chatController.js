// tech-master-LA/backend/controllers/chatController.js
const chatService = require("../services/chatService");

const createConversation = async (req, res) => {
  try {
    const { userId, topic } = req.body;
    const result = await chatService.createConversation(userId, topic);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result.conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    console.log("Received message request:", { conversationId, message });

    // Validate required fields
    if (!conversationId || !message) {
      return res.status(400).json({
        error: "Missing required fields: conversationId and message",
      });
    }

    // Call the service
    const result = await chatService.sendMessage(conversationId, message);

    // Handle service response
    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        error: result.error,
      });
    }

    // Send successful response with consistent structure
    res.json({
      success: true,
      data: {
        message: result.data.message,
        conversation: result.data.conversation,
      },
    });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
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

    // Return the saved quiz
    res.status(201).json(result.quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllConversations = async (req, res) => {
  try {
    const { userId } = req.query; // Optional query parameter
    const result = await chatService.getAllConversations(userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const result = await chatService.getConversationById(conversationId);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result.conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const result = await chatService.deleteConversation(conversationId);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
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
