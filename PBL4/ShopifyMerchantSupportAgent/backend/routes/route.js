import express from "express";
import ChatController from "../controllers/ChatController.js";

const router = express.Router();
const chatController = new ChatController();

// Chat endpoints
router.post("/chat", (req, res) => chatController.sendMessage(req, res));
router.get("/history/:sessionId", (req, res) =>
  chatController.getHistory(req, res)
);
router.post("/feedback", (req, res) => chatController.updateFeedback(req, res));
router.delete("/chat/:sessionId", (req, res) =>
  chatController.clearConversation(req, res)
);
router.post("/session", (req, res) => chatController.createSession(req, res));

// Legacy endpoint
router.get("/", (req, res) => {
  res.json({ message: "Welcome to Shopify Merchant Support Agent API" });
});

export default router;
