const express = require("express");
const router = express.Router();
const {
  getLeaderboardController,
  getLeaderboardStatsController,
} = require("../controllers/leaderboardController.js");

// Get leaderboard data
router.get("/", getLeaderboardController);

// Get leaderboard statistics
router.get("/stats", getLeaderboardStatsController);

module.exports = router;
