const express = require("express");
const router = express.Router();
const Quiz = require("../models/quizModel");

router.get("/", async (req, res) => {
  try {
    console.log("Stats endpoint hit");

    // Get all quizzes
    const quizzes = await Quiz.find({});
    console.log("Found quizzes:", quizzes.length);

    // Calculate total quizzes
    const totalQuizzes = quizzes.length;

    // Calculate average score across all attempts
    let totalScore = 0;
    let totalAttempts = 0;

    quizzes.forEach((quiz) => {
      console.log(`Processing quiz: ${quiz.title}`);
      quiz.attempts.forEach((attempt) => {
        totalScore += attempt.score;
        totalAttempts++;
      });
    });

    const avgScore =
      totalAttempts > 0 ? (totalScore / totalAttempts).toFixed(2) : 0;

    // Calculate additional statistics
    const topicDistribution = quizzes.reduce((acc, quiz) => {
      acc[quiz.topic] = (acc[quiz.topic] || 0) + 1;
      return acc;
    }, {});

    const totalAttemptsByQuiz = quizzes.map((quiz) => ({
      quizTitle: quiz.title,
      attempts: quiz.attempts.length,
    }));

    const response = {
      totalQuizzes,
      avgScore: parseFloat(avgScore),
      topicDistribution,
      totalAttempts,
      totalAttemptsByQuiz,
    };

    console.log("Sending response:", response);
    res.json(response);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      error: "Failed to fetch statistics",
      details: error.message,
    });
  }
});

module.exports = router;
