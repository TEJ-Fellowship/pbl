const router = require("express").Router();
const { GameMode, Player, ScoreSubmission } = require("../models");
const { sequelize } = require("../util/db");

// GET /api/leaderboard/:game_mode?limit=100 - Get top players
router.get("/:game_mode", async (req, res) => {
  try {
    const { game_mode } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    // Validate game mode exists (can be ID or name)
    const gameModeId = isNaN(game_mode) 
      ? await GameMode.findOne({ where: { name: game_mode } }).then(gm => gm?.id)
      : parseInt(game_mode);
    
    if (!gameModeId) {
      return res.status(404).json({ error: "Game mode not found" });
    }

    // Get top players by total score for this game mode
    const leaderboard = await sequelize.query(
      `
      SELECT 
        p.id as player_id,
        p.username,
        p.level,
        COALESCE(SUM(ss.score), 0) as total_score,
        COUNT(ss.id) as games_played
      FROM players p
      LEFT JOIN score_submissions ss ON p.id = ss.player_id 
        AND ss.game_mode_id = :gameModeId 
        AND ss.is_valid = true
      GROUP BY p.id, p.username, p.level
      HAVING COALESCE(SUM(ss.score), 0) > 0
      ORDER BY total_score DESC
      LIMIT :limit
      `,
      {
        replacements: { gameModeId, limit },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Format the response
    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      playerId: entry.player_id,
      username: entry.username,
      level: entry.level,
      totalScore: parseInt(entry.total_score || 0),
      gamesPlayed: parseInt(entry.games_played || 0),
    }));

    res.json({
      gameModeId: gameModeId,
      limit: limit,
      leaderboard: formattedLeaderboard,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;