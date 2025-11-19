const router = require("express").Router();
const { ScoreSubmission } = require("../models");

router.post("/", async (req, res) => {
  const { playerId, gameModeId, score, gameDurationSeconds } = req.body;
  const scoreSubmission = await ScoreSubmission.create({ playerId, gameModeId, score, gameDurationSeconds });
  res.json(scoreSubmission);
});

module.exports = router;