const express = require("express");
const router = express.Router();
const redisService = require("../services/redisService");

/**
 * GET /api/players/:id/rank/:gameMode
 * Get player's rank for a specific game mode
 * 
 * Query params:
 * - type: "global" | "daily" (default: "global")
 */
router.get("/:id/rank/:gameMode", async (req, res) => {
  try {
    const playerId = req.params.id;
    const gameMode = parseInt(req.params.gameMode);
    const type = req.query.type || "global";

    // Validate game mode
    const gameModeData = await redisService.getGameMode(gameMode);
    if (!gameModeData) {
      return res.status(404).json({
        error: "Game mode not found",
        gameMode,
      });
    }

    // Get player rank
    const rankData = await redisService.getPlayerRank(gameMode, playerId, type);

    if (!rankData) {
      return res.status(404).json({
        error: "Player not found in leaderboard",
        playerId,
        gameMode,
      });
    }

    // Get player info
    const player = await redisService.getPlayer(playerId);

    res.json({
      playerId,
      username: player?.username || "Unknown",
      gameMode,
      gameModeName: gameModeData.name,
      type,
      rank: rankData.rank,
      score: rankData.score,
    });
  } catch (error) {
    console.error("Error fetching player rank:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * GET /api/players/:id/stats
 * Get player statistics
 */
router.get("/:id/stats", async (req, res) => {
  try {
    const playerId = req.params.id;

    // Get player data
    const player = await redisService.getPlayer(playerId);

    if (!player) {
      return res.status(404).json({
        error: "Player not found",
        playerId,
      });
    }

    // Get ranks for all game modes
    const gameModes = await redisService.getAllGameModes();
    const ranks = {};

    for (const mode of gameModes) {
      const globalRank = await redisService.getPlayerRank(mode.id, playerId, "global");
      const dailyRank = await redisService.getPlayerRank(mode.id, playerId, "daily");

      ranks[mode.id] = {
        gameMode: mode.name,
        global: globalRank
          ? {
              rank: globalRank.rank,
              score: globalRank.score,
            }
          : null,
        daily: dailyRank
          ? {
              rank: dailyRank.rank,
              score: dailyRank.score,
            }
          : null,
      };
    }

    res.json({
      player: {
        id: player.id,
        username: player.username,
        total_score: player.total_score,
        games_played: player.games_played,
        created_at: player.created_at,
      },
      ranks,
    });
  } catch (error) {
    console.error("Error fetching player stats:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;

