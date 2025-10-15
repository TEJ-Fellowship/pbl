import express from "express";
import { chatController } from "../controllers/chatController.js";
import { validateChatRequest } from "../middleware/validation.js";

const router = express.Router();

// Chat endpoints
router.post("/", validateChatRequest, chatController.sendMessage);
router.get("/history/:sessionId", chatController.getHistory);
router.post("/session", chatController.createSession);
router.delete("/session/:sessionId", chatController.deleteSession);

export default router;
