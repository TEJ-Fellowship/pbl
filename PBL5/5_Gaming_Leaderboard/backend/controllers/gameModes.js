const router = require("express").Router();
const { GameMode } = require("../models");

router.get("/", async (req, res) => {
  const gameModes = await GameMode.findAll();
  res.json(gameModes);
});

router.post("/", async (req, res) => {  
    const { name, max_score_per_game, avg_game_duration_minutes } = req.body;   
    const gameMode = await GameMode.create({ name, max_score_per_game, avg_game_duration_minutes });
    res.json(gameMode);
});

module.exports = router;