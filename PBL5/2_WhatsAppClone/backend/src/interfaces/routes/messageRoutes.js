// Message routes

import express from "express";
import {
  getMessages,
  sendMessage,
  getUserConversations,
  initiateConversation,
} from "../controllers/messageController.js";

const router = express.Router();

// GET all conversations for a user
router.get("/user/:userId", getUserConversations);

// GET messages for a conversation
router.get("/:conversationId", getMessages);

// POST send a new message
router.post("/send", sendMessage);

router.post("/initiate", initiateConversation);

export default router;
