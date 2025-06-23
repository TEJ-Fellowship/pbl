// routes/quizRoutes.js

const express = require("express");
const router = express.Router();
const {
  getQuizzes,
  getQuiz,
  createQuiz,
  deleteQuiz,
  startQuiz,
  saveProgress,
  submitQuiz,
  abandonAttempt,
  cleanupAttempts,
  getQuizStats,
  regenerateQuiz,
} = require("../controllers/quizController");

router.get("/", getQuizzes);
router.post("/", createQuiz);

router.get("/:id", getQuiz);
router.delete("/:id", deleteQuiz);

router.post("/:id/start", startQuiz);
router.post("/:id/save", saveProgress);
router.post("/:id/submit", submitQuiz);
router.post("/:id/abandon", abandonAttempt);
router.post("/:id/cleanup", cleanupAttempts);
router.get("/:id/stats", getQuizStats);
router.post("/:id/regenerate", regenerateQuiz);

module.exports = router;
