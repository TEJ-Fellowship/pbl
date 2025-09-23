import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { upload, handleMulterError } from "../middleware/upload.js";
import {
  getOrCreateChat,
  getUserChats,
  sendTextMessage,
  sendVoiceMessage,
  getChatMessages,
  deleteMessage
} from "../controllers/chatController.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getUserChats);
router.get("/:friendId/chat", getOrCreateChat);
router.get("/:chatId/messages", getChatMessages);
router.post("/:chatId/text", sendTextMessage);
router.post("/:chatId/voice", upload.single("voice"), handleMulterError, sendVoiceMessage);
router.delete("/messages/:messageId", deleteMessage);

export default router;