const express = require("express");
const router = express.Router();
const redisService = require("../services/redisService");

/**
 * GET /api/leaderboard/:gameMode
 * Get leaderboard for a specific game mode with cursor-based pagination
 * 
 * Query params:
 * - type: "global" | "daily" (default: "global")
 * - limit: number (default: 100, max: 1000)
 * - cursor: string (base64 encoded cursor for pagination)
 * - direction: "next" | "prev" (default: "next")
 */
router.get("/:gameMode", async (req, res) => {
  try {
    const gameMode = parseInt(req.params.gameMode);
    const type = req.query.type || "global";
    const limit = parseInt(req.query.limit) || 100;
    const cursor = req.query.cursor || null;
    const direction = req.query.direction || "next";

    // Validate game mode
    const gameModeData = await redisService.getGameMode(gameMode);
    if (!gameModeData) {
      return res.status(404).json({
        error: "Game mode not found",
        gameMode,
      });
    }

    // Validate direction
    if (direction !== "next" && direction !== "prev") {
      return res.status(400).json({
        error: "Invalid direction. Must be 'next' or 'prev'",
      });
    }

    // Get leaderboard from Redis with cursor pagination
    const result = await redisService.getLeaderboardWithCursor(
      gameMode,
      type,
      limit,
      cursor,
      direction
    );

    res.json({
      gameMode,
      gameModeName: gameModeData.name,
      type,
      pagination: {
        limit: result.pagination.limit,
        total: result.totalCount,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        prevCursor: result.pagination.prevCursor,
      },
      leaderboard: result.leaderboard,
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