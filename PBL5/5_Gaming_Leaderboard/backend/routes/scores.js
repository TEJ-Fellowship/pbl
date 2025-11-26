const express = require("express");
const router = express.Router();
const kafkaService = require("../services/kafkaService");
const validationService = require("../services/validationService");
const redisService = require("../services/redisService");

/**
 * POST /api/scores/submit
 * Submit a game score
 * 
 * Body:
 * {
 *   "playerId": "uuid",
 *   "username": "player123",
 *   "gameMode": 1,
 *   "score": 5000,
 *   "gameDurationSeconds": 300
 * }
 */
router.post("/submit", async (req, res) => {
  try {
    const { playerId, username, gameMode, score, gameDurationSeconds } = req.body;

    // Validate player data
    const playerValidation = validationService.validatePlayerData(playerId, username);
    if (!playerValidation.valid) {
      return res.status(400).json({
        error: "Validation failed",
        details: playerValidation.errors,
      });
    }

    // Validate score
    const scoreValidation = await validationService.validateScore(
      playerId,
      gameMode,
      score,
      gameDurationSeconds
    );

    if (!scoreValidation.valid) {
      return res.status(400).json({
        error: "Score validation failed",
        details: scoreValidation.errors,
      });
    }

    // Ensure player exists in Redis
    await redisService.createOrUpdatePlayer(playerId, username);

    // Publish to Kafka (async, non-blocking)
    const event = {
      playerId,
      username,
      gameMode,
      score,
      gameDurationSeconds,
      timestamp: new Date().toISOString(),
    };

    await kafkaService.publishScoreSubmitted(event);

    // Return 202 Accepted (event is being processed)
    res.status(202).json({
      message: "Score submitted successfully",
      playerId,
      gameMode,
      score,
    });
  } catch (error) {
    console.error("Error submitting score:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;

