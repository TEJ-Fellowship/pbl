const express = require("express");
const router = express.Router();
const redisService = require("../services/redisService");

/**
 * GET /api/leaderboard/:gameMode
 * Get leaderboard for a specific game mode
 * 
 * Query params:
 * - type: "global" | "daily" (default: "global")
 * - limit: number (default: 100, max: 1000)
 * - offset: number (default: 0)
 */
router.get("/:gameMode", async (req, res) => {
  try {
    const gameMode = parseInt(req.params.gameMode);
    const type = req.query.type || "global";
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    // Validate game mode
    const gameModeData = await redisService.getGameMode(gameMode);
    if (!gameModeData) {
      return res.status(404).json({
        error: "Game mode not found",
        gameMode,
      });
    }

    // Get leaderboard from Redis
    const leaderboard = await redisService.getLeaderboard(gameMode, type, limit, offset);

    res.json({
      gameMode,
      gameModeName: gameModeData.name,
      type,
      limit,
      offset,
      total: leaderboard.length,
      leaderboard,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;

