// services/statsService.js

const Quiz = require("../models/quizModel");

const getQuizStatistics = async (userId = null) => {
  try {
    // Build query based on whether userId is provided
    const query = userId ? { userId } : {};

    // Fetch quizzes from the database
    const quizzes = await Quiz.find(query);

    // Calculate total quizzes
    const totalQuizzes = quizzes.length;

    // Calculate average score across all completed attempts only
    let totalScore = 0;
    let totalAttempts = 0;
    const latestScoreByQuiz = [];
    const quizAttempts = [];

    quizzes.forEach((quiz) => {
      // Use the new method to get only completed attempts
      const completedAttempts = quiz.getCompletedAttempts();

      completedAttempts.forEach((attempt) => {
        totalScore += attempt.score || 0;
        totalAttempts++;
      });

      const latestAttempt = completedAttempts[completedAttempts.length - 1];
      latestScoreByQuiz.push({
        quizTitle: quiz.title,
        latestScore: latestAttempt ? latestAttempt.score : null,
        quizId: quiz._id,
      });

      quizAttempts.push({
        quizTitle: quiz.title,
        attempts: completedAttempts.length, // Only count completed attempts
        quizId: quiz._id,
      });
    });

    const avgScore =
      totalAttempts > 0 ? (totalScore / totalAttempts).toFixed(2) : 0;

    // Calculate topic distribution
    const topicDistribution = quizzes.reduce((acc, quiz) => {
      acc[quiz.topic] = (acc[quiz.topic] || 0) + 1;
      return acc;
    }, {});

    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentQuizzes = quizzes.filter(
      (quiz) => new Date(quiz.createdAt) > sevenDaysAgo
    ).length;

    // Calculate performance trends using only completed attempts
    const performanceTrends = quizzes.map((quiz) => {
      const completedAttempts = quiz.getCompletedAttempts();
      return {
        quizTitle: quiz.title,
        quizId: quiz._id,
        topic: quiz.topic,
        attempts: completedAttempts.length, // Only count completed attempts
        bestScore:
          completedAttempts.length > 0
            ? Math.max(...completedAttempts.map((a) => a.score || 0))
            : 0,
        averageScore:
          completedAttempts.length > 0
            ? (
                completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) /
                completedAttempts.length
              ).toFixed(2)
            : 0,
      };
    });

    return {
      totalQuizzes,
      avgScore: parseFloat(avgScore),
      topicDistribution,
      totalAttempts, // This now represents only completed attempts
      recentQuizzes,
      performanceTrends,
      quizAttempts,
      latestScoreByQuiz,
    };
  } catch (error) {
    console.error("Error in getQuizStatistics:", error);
    throw error;
  }
};

const getUserStats = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    return await getQuizStatistics(userId);
  } catch (error) {
    console.error("Error in getUserStats:", error);
    throw error;
  }
};

module.exports = { getQuizStatistics, getUserStats };
