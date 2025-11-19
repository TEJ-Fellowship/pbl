const express = require("express");
const app = express();

app.use(express.json());

const { PORT } = require("./util/config");
const { connectToDatabase, disconnect } = require("./util/db.js");

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
  await connectToDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});