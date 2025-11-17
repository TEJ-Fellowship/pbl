const router = require("express").Router();
const { Player, ScoreSubmission, GameMode } = require("../models");
const { sequelize } = require("../util/db");

router.post("/", async (req, res) => {
  const { username, email, password } = req.body;
  const player = await Player.create({ username, email });
  res.json(player);
});

// GET /api/players/:id/rank/:game_mode
router.get("/:id/rank/:game_mode", async (req, res) => {
  try {
    const { id, game_mode } = req.params;
    
    // Validate player exists
    const player = await Player.findByPk(id);
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    // Validate game mode exists (can be ID or name)
    const gameModeId = isNaN(game_mode) 
      ? await GameMode.findOne({ where: { name: game_mode } }).then(gm => gm?.id)
      : parseInt(game_mode);
    
    if (!gameModeId) {
      return res.status(404).json({ error: "Game mode not found" });
    }

    // Get player's total score for this game mode (sum of all valid scores)
    const playerScoreResult = await ScoreSubmission.findOne({
      where: {
        playerId: id,
        gameModeId: gameModeId,
        isValid: true,
      },
      attributes: [
        [sequelize.fn("SUM", sequelize.col("score")), "totalScore"],
      ],
      raw: true,
    });

    const playerTotalScore = parseInt(playerScoreResult?.totalScore || 0);

    // Count how many players have a higher total score for this game mode
    const rankResult = await sequelize.query(
      `
      SELECT COUNT(DISTINCT player_id) + 1 as rank
      FROM (
        SELECT player_id, SUM(score) as total_score
        FROM score_submissions
        WHERE game_mode_id = :gameModeId AND is_valid = true
        GROUP BY player_id
        HAVING SUM(score) > :playerTotalScore
      ) as ranked_players
      `,
      {
        replacements: { gameModeId, playerTotalScore },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const rank = parseInt(rankResult[0]?.rank || 1);

    res.json({
      playerId: id,
      gameModeId: gameModeId,
      rank: rank,
      totalScore: playerTotalScore,
    });
  } catch (error) {
    console.error("Error fetching player rank:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/players/:id/stats
router.get("/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate player exists
    const player = await Player.findByPk(id);
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    // Get player's stats per game mode
    const statsPerGameMode = await ScoreSubmission.findAll({
      where: {
        playerId: id,
        isValid: true,
      },
      attributes: [
        "gameModeId",
        [sequelize.fn("COUNT", sequelize.col("id")), "gamesPlayed"],
        [sequelize.fn("SUM", sequelize.col("score")), "totalScore"],
        [sequelize.fn("MAX", sequelize.col("score")), "bestScore"],
        [sequelize.fn("AVG", sequelize.col("score")), "averageScore"],
        [sequelize.fn("AVG", sequelize.col("game_duration_seconds")), "averageDuration"],
      ],
      include: [
        {
          model: GameMode,
          as: "gameMode",
          attributes: ["id", "name"],
        },
      ],
      group: ["gameModeId", "gameMode.id", "gameMode.name"],
      raw: false,
    });

    // Format the response
    const formattedStats = statsPerGameMode.map((stat) => ({
      gameMode: {
        id: stat.gameMode.id,
        name: stat.gameMode.name,
      },
      gamesPlayed: parseInt(stat.dataValues.gamesPlayed),
      totalScore: parseInt(stat.dataValues.totalScore || 0),
      bestScore: parseInt(stat.dataValues.bestScore || 0),
      averageScore: parseFloat(stat.dataValues.averageScore || 0).toFixed(2),
      averageDuration: stat.dataValues.averageDuration
        ? parseFloat(stat.dataValues.averageDuration).toFixed(2)
        : null,
    }));

    res.json({
      playerId: id,
      username: player.username,
      level: player.level,
      totalScore: player.total_score,
      gamesPlayed: player.games_played,
      statsByGameMode: formattedStats,
    });
  } catch (error) {
    console.error("Error fetching player stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;