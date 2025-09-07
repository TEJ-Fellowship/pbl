const express = require("express");
const router = express.Router();
require("dotenv").config();
const Chat = require("../models/chat");

router.get("/chats/:userId", async (request, response, next) => {
  const userId = request.params.userId;
  try {
    const userChats = await Chat.find({ user: userId }).sort({ _id: 1 });
    let lastAnswer = [];
    if (userChats.length > 0) {
      lastAnswer = [{ answer: userChats[userChats.length - 1].answer }];
    }

    response.status(200).json({
      data: lastAnswer, // array with the most recent answer
      chats: userChats, // full chat documents, not just IDs
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
