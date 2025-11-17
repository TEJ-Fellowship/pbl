const express = require("express");
const app = express();

const { PORT } = require("./util/config");
const { connectToDatabase } = require("./util/db.js");

// Import controllers
const leaderboardsRouter = require("./controllers/leaderboards");
const playersRouter = require("./controllers/players");
const scoresRouter = require("./controllers/scores");
const gameModesRouter = require("./controllers/gameModes");
// Middleware
app.use(express.json());

// Register routes
app.use("/api/leaderboard", leaderboardsRouter);
app.use("/api/players", playersRouter);
app.use("/api/scores", scoresRouter);
app.use("/api/gameModes", gameModesRouter);
const start = async () => {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();