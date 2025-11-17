const router = require("express").Router();
const { Player } = require("../models");

router.post("/", async (req, res) => {
  const { username, email, password } = req.body;
  const player = await Player.create({ username, email, password });
  res.json(player);
});

module.exports = router;