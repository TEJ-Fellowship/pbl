// routes/quizRoutes.js

const express = require("express");
const router = express.Router();
const {
  getAllQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  recordAttempt,
  getAttempts,
  deleteQuiz,
} = require("../controllers/quizController");

router.get("/", getAllQuizzes);
router.get("/:id", getQuizById);
router.post("/", createQuiz);
router.put("/:id", updateQuiz);
router.post("/:id/attempts", recordAttempt);
router.get("/:id/attempts", getAttempts);
router.delete("/:id", deleteQuiz);

module.exports = router;
