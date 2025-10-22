import express from "express";
import { chatController } from "../controllers/chatController.js";
import { validateChatRequest } from "../middleware/validation.js";

const router = express.Router();

// Chat endpoints
router.post("/", validateChatRequest, chatController.sendMessage);
router.get("/history/:sessionId", chatController.getHistory);
router.post("/session", chatController.createSession);
router.delete("/session/:sessionId", chatController.deleteSession);

// Token tracking endpoints
router.get("/tokens/:sessionId", chatController.getTokenUsage);
router.put("/tokens/:sessionId", chatController.updateTokenLimit);

// Session management endpoints
router.get("/sessions", chatController.getAllSessions);
router.get("/sessions/:sessionId", chatController.getSessionDetails);

export default router;
