const leaderboardService = require("../services/leaderboardService.js");

const getLeaderboardController = async (req, res) => {
  try {
    const leaderboardData = await leaderboardService.getLeaderboardData();
    res.status(200).json(leaderboardData);
  } catch (error) {
    console.error("Error in getLeaderboardController:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const getLeaderboardStatsController = async (req, res) => {
  try {
    const stats = await leaderboardService.getLeaderboardStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error in getLeaderboardStatsController:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = {
  getLeaderboardController,
  getLeaderboardStatsController,
};
