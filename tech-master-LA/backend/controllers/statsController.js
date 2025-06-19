// controllers/statsController.js

const { getQuizStatistics } = require("../services/statsService");

const getQuizStats = async (req, res) => {
  try {
    console.log("Stats endpoint hit");

    const stats = await getQuizStatistics();

    console.log("Sending response:", stats);

    res.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      error: "Failed to fetch statistics",
      details: error.message,
    });
  }
};

module.exports = { getQuizStats };
