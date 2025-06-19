// services/statsService.js

const Quiz = require("../models/quizModel");

const getQuizStatistics = async () => {
  // Fetch all quizzes from the database
  const quizzes = await Quiz.find({});
  // Calculate total quizzes
  const totalQuizzes = quizzes.length;
  // Calculate average score across all attempts
  let totalScore = 0;
  let totalAttempts = 0;
  const latestScoreByQuiz = [];

  quizzes.forEach((quiz) => {
    const attempts = quiz.attempts;

    attempts.forEach((attempt) => {
      totalScore += attempt.score;
      totalAttempts++;
    });

    const latestAttempt = attempts[attempts.length - 1];
    latestScoreByQuiz.push({
      quizTitle: quiz.title,
      latestScore: latestAttempt ? latestAttempt.score : null,
    });
  });

  const avgScore =
    totalAttempts > 0 ? (totalScore / totalAttempts).toFixed(2) : 0;

  // Calculate topic distribution
  const topicDistribution = quizzes.reduce((acc, quiz) => {
    acc[quiz.topic] = (acc[quiz.topic] || 0) + 1;
    return acc;
  }, {});

  const totalAttemptsByQuiz = quizzes.map((quiz) => ({
    quizTitle: quiz.title,
    attempts: quiz.attempts.length,
  }));

  return {
    totalQuizzes,
    avgScore: parseFloat(avgScore),
    topicDistribution,
    totalAttempts,
    totalAttemptsByQuiz,
    latestScoreByQuiz,
  };
};

module.exports = { getQuizStatistics };
