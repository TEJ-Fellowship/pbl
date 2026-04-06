const express = require("express");
const { handleChatQuery } = require("../controllers/chat.controller");

const router = express.Router();

router.post("/", handleChatQuery);

module.exports = router;
