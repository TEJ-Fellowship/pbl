import express from "express";
import {
  processChatMessage,
  getConversationHistory,
  getChatHistoryList,
  processClarificationResponse,
  getConversationStats,
  cleanupConversationState,
} from "../controllers/chatController.js";
import analyticsRoutes from "./analyticsRoutes.js";
import feedbackRoutes from "./feedbackRoutes.js";

const router = express.Router();

// Health check route
router.get("/", (req, res) => {
  res.json({
    message: "Shopify Merchant Support Agent API with Multi-Turn Conversations",
    status: "running",
    endpoints: [
      "/chat",
      "/history/:sessionId",
      "/history",
      "/clarify",
      "/stats/:sessionId",
      "/cleanup/:sessionId",
      "/analytics/dashboard",
      "/analytics/segment/:segment",
      "/analytics/questions/:intent",
      "/analytics/confidence-trends",
      "/analytics/clear-cache",
      "/feedback/store",
      "/feedback/stats",
      "/feedback/intent/:intent",
      "/feedback/analyze",
      "/feedback/retrain-candidates",
      "/feedback/auto-retrain",
      "/feedback/clear-cache",
    ],
    features: [
      "Multi-turn conversation handling",
      "Follow-up question detection",
      "Ambiguity clarification",
      "Context compression",
      "User preference tracking",
      "MCP tools integration",
      "Intent classification",
      "Proactive suggestions",
      "Analytics dashboard",
      "Merchant segment insights",
      "Feedback loop system",
      "Auto-retrain mechanism",
    ],
  });
});

// Analytics routes
router.use("/analytics", analyticsRoutes);

// Feedback routes
router.use("/feedback", feedbackRoutes);

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

// Get chat history list (last 8 conversations)
router.get("/history", async (req, res) => {
  try {
    const result = await getChatHistoryList();
    res.json(result);
  } catch (error) {
    console.error("Chat history list API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Clarification response endpoint
router.post("/clarify", async (req, res) => {
  try {
    const { clarificationResponse, originalQuestion, sessionId } = req.body;

    if (!clarificationResponse || !originalQuestion || !sessionId) {
      return res.status(400).json({
        error:
          "Missing required fields: clarificationResponse, originalQuestion, and sessionId",
      });
    }

    const result = await processClarificationResponse(
      clarificationResponse,
      originalQuestion,
      sessionId
    );
    res.json(result);
  } catch (error) {
    console.error("Clarification API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Get conversation statistics
router.get("/stats/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await getConversationStats(sessionId);
    res.json(result);
  } catch (error) {
    console.error("Stats API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Clean up conversation state
router.delete("/cleanup/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await cleanupConversationState(sessionId);
    res.json(result);
  } catch (error) {
    console.error("Cleanup API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

export default router;
