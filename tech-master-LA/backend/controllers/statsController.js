// controllers/statsController.js

const { getQuizStatistics, getUserStats } = require("../services/statsService");

const getQuizStats = async (req, res) => {
  try {
    console.log("Stats endpoint hit");

    // Get user ID from auth middleware
    const userId = req.user?.id;
    console.log("User ID for stats:", userId);

    let stats;
    if (userId) {
      // Get user-specific stats
      stats = await getUserStats(userId);
    } else {
      // Get global stats (for admin purposes)
      stats = await getQuizStatistics();
    }

    console.log("Sending response:", stats);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
      details: error.message,
    });
  }
};

module.exports = { getQuizStats };
