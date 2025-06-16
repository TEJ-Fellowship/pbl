const express = require("express");
const router = express.Router();

// TODO: Require auth middleware for protected routes
// const auth = require('../middleware/auth')

// Dummy endpoint
router.post("/generate", (req, res) => {
  res.status(200).json({ message: "Quiz generation endpoint ready" });
});

router.get("/", (req, res) => {
  res.status(200).json({ quizzes: [] });
});

module.exports = router;
