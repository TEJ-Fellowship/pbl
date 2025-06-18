const Quiz = require("../models/quizModel");

// Controller to gather and return various statistics about quizzes
const getQuizStats = async (req, res) => {
  try {
    console.log("Stats endpoint hit");

    // Fetch all quizzes from the database
    const quizzes = await Quiz.find({});
    console.log("Found quizzes:", quizzes.length);

    // Total number of quizzes
    const totalQuizzes = quizzes.length;

    // Variables to calculate average score across all attempts
    let totalScore = 0;
    let totalAttempts = 0;

    // Latest score by quiz (map of quiz title to last attempt's score)
    const latestScoreByQuiz = [];

    quizzes.forEach((quiz) => {
      console.log(`Processing quiz: ${quiz.title}`);

      const attempts = quiz.attempts;

      // Update total attempts and scores
      attempts.forEach((attempt) => {
        totalScore += attempt.score;
        totalAttempts++;
      });

      // Get the latest score if attempts exist
      const latestAttempt = attempts[attempts.length - 1];
      latestScoreByQuiz.push({
        quizTitle: quiz.title,
        latestScore: latestAttempt ? latestAttempt.score : null,
      });
    });

    // Calculate average score (rounded to 2 decimal places)
    const avgScore =
      totalAttempts > 0 ? (totalScore / totalAttempts).toFixed(2) : 0;

    // Count how many quizzes exist for each topic
    const topicDistribution = quizzes.reduce((acc, quiz) => {
      acc[quiz.topic] = (acc[quiz.topic] || 0) + 1;
      return acc;
    }, {});

    // Count number of attempts per quiz
    const totalAttemptsByQuiz = quizzes.map((quiz) => ({
      quizTitle: quiz.title,
      attempts: quiz.attempts.length,
    }));

    // Construct the final response object
    const response = {
      totalQuizzes, // Total number of quizzes
      avgScore: parseFloat(avgScore), // Average score across all attempts
      topicDistribution, // Number of quizzes per topic
      totalAttempts, // Total number of attempts across all quizzes
      totalAttemptsByQuiz, // Attempts per quiz
      latestScoreByQuiz, // Latest score per quiz
    };

    console.log("Sending response:", response);

    // Send the statistics as JSON
    res.json(response);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      error: "Failed to fetch statistics",
      details: error.message,
    });
  }
};

module.exports = { getQuizStats };
