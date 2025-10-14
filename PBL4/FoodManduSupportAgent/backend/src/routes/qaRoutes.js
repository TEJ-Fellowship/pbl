import express from "express";
import {
  handleChat,
  getChatHistory,
  healthCheck,
} from "../controllers/qacontrollers.js";
import { validateChatRequest } from "../middlewares/validateRequest.js";

const router = express.Router();

// Health check endpoint
router.get("/health", healthCheck); // GET /api/health

// Chat endpoints
router.post("/chat", validateChatRequest, handleChat); // POST /api/chat
router.get("/chat/history", getChatHistory); // GET /api/chat/history

export default router;
