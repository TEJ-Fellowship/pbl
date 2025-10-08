const express = require("express");
const { handleQuery } = require("../services/queryService");

const router = express.Router();

router.post("/query", async (req, res) => {
  const { question } = req.body || {};
  if (!question) {
    return res.status(400).json({ error: "Missing question" });
  }

  try {
    const response = await handleQuery(question);
    return res.json(response);
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

