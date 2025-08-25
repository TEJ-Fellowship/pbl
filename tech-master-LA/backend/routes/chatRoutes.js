const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth-middleware");
const {
  createConversation,
  sendMessage,
  generateQuizFromContext,
  getAllConversations,
  getConversationById,
  getUserConversations,
  deleteConversation,
} = require("../controllers/chatController");

router.use(auth);

router.post("/conversation", createConversation);
router.post("/message", sendMessage);
router.post("/generate-quiz", generateQuizFromContext);

router.get("/conversations", getAllConversations);
router.get("/conversations/:conversationId", getConversationById);
router.get("/users/:userId/conversations", getUserConversations);
router.delete("/conversations/:conversationId", deleteConversation);

module.exports = router;
