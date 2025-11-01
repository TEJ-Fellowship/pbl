const express = require("express");
const { handleQuery } = require("../services/queryServiceHybrid");
const { getChatHistory } = require("../services/chat/chatHistory");

const router = express.Router();

router.post("/query", async (req, res) => {
  const { question, sessionId } = req.body || {};
  if (!question) {
    return res.status(400).json({ error: "Missing question" });
  }

  try {
    const response = await handleQuery(question, sessionId);
    return res.json(response);
  } catch (error) {
    console.error("Error in chat controller:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get chat history for a session
router.get("/chat/history/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const limit = parseInt(req.query.limit) || 100;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  try {
    const history = await getChatHistory(sessionId, limit);
    return res.json({
      sessionId,
      history,
      count: history.length,
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
