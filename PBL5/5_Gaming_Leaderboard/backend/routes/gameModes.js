const express = require("express");
const router = express.Router();
const redisService = require("../services/redisService");

/**
 * GET /api/game-modes
 * Get all available game modes
 */
router.get("/", async (req, res) => {
  try {
    const gameModes = await redisService.getAllGameModes();

    res.json({
      total: gameModes.length,
      gameModes,
    });
  } catch (error) {
    console.error("Error fetching game modes:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * GET /api/game-modes/:id
 * Get specific game mode details
 */
router.get("/:id", async (req, res) => {
  try {
    const gameModeId = parseInt(req.params.id);
    const gameMode = await redisService.getGameMode(gameModeId);

    if (!gameMode) {
      return res.status(404).json({
        error: "Game mode not found",
        gameModeId,
      });
    }

    res.json({
      id: gameModeId,
      ...gameMode,
    });
  } catch (error) {
    console.error("Error fetching game mode:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;

