const express = require("express");
const app = express();

app.use(express.json());

const { PORT } = require("./util/config");
const { connectToDatabase, disconnect } = require("./util/db.js");
const { startConsumer } = require("./consumers/leaderboardUpdater");
const redisService = require("./services/redisService");

// Routes
const scoresRouter = require("./routes/scores");
const leaderboardRouter = require("./routes/leaderboard");
const playersRouter = require("./routes/players");
const gameModesRouter = require("./routes/gameModes");

app.use("/api/scores", scoresRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/players", playersRouter);
app.use("/api/game-modes", gameModesRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Gaming Leaderboard API",
    version: "1.0.0",
    endpoints: {
      scores: "POST /api/scores/submit",
      leaderboard: "GET /api/leaderboard/:gameMode",
      playerRank: "GET /api/players/:id/rank/:gameMode",
      playerStats: "GET /api/players/:id/stats",
      gameModes: "GET /api/game-modes",
    },
  });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await disconnect();
  process.exit(0);
});

const start = async () => {
  try {
    // Connect to services (Redis, Kafka)
    await connectToDatabase();
    console.log("✅ All services connected");

    // Initialize game modes in Redis (if not exists)
    await redisService.initializeGameModes();

    // Start Express server immediately (don't wait for consumer)
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}`);
    });

    // Start Kafka consumer in background (non-blocking)
    // This allows the server to start serving requests immediately
    startConsumer().catch((err) => {
      console.error("⚠️ Failed to start consumer (will retry):", err);
      // Consumer failure shouldn't crash the server
      // It can be restarted manually or via health checks
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
