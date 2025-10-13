import express from "express";
import {
  processChatMessage,
  getConversationHistory,
} from "../controllers/chatController.js";

const router = express.Router();

// Health check route
router.get("/", (req, res) => {
  res.json({
    message: "Shopify Merchant Support Agent API",
    status: "running",
    endpoints: ["/chat", "/history/:sessionId"],
  });
});

// Chat API endpoints
router.post("/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({
        error: "Missing required fields: message and sessionId",
      });
    }

    const result = await processChatMessage(message, sessionId);
    res.json(result);
  } catch (error) {
    console.error("Chat API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.get("/history/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await getConversationHistory(sessionId);
    res.json(result);
  } catch (error) {
    console.error("History API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

export default router;
