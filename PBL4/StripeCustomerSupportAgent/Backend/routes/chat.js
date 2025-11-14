import express from "express";
import { chatController } from "../controllers/chatController.js";
import { validateChatRequest } from "../middleware/validation.js";
import { optionalAuth, requireUserId } from "../middleware/optionalAuth.js";

const router = express.Router();

// Apply optional auth to all chat routes
router.use(optionalAuth);

// Chat endpoints - Allow anonymous users
router.post(
  "/",
  validateChatRequest,
  requireUserId,
  chatController.sendMessage
);
router.get("/history/:sessionId", chatController.getHistory);
router.post("/session", requireUserId, chatController.createSession);
router.delete("/session/:sessionId", chatController.deleteSession);

// Token tracking endpoints
router.get("/tokens/:sessionId", chatController.getTokenUsage);
router.put("/tokens/:sessionId", chatController.updateTokenLimit);

// Session management endpoints
router.get("/sessions", requireUserId, chatController.getAllSessions);
router.get("/sessions/:sessionId", chatController.getSessionDetails);
router.post("/transfer-session", requireUserId, chatController.transferSession);

export default router;
