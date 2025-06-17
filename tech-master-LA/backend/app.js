console.log("Starting tech-master-LA Server...");
const express = require("express");
const app = express();
const { url } = require("./config/keys");
const { errorHandler, requestLogger } = require("./utils/middleware");
const mongoose = require("mongoose");
const cors = require("cors");
const quizRoutes = require("./controllers/quiz.js");
const statsRoutes = require("./controllers/stats.js");

//middleware
app.use(express.json());
app.use(cors());
app.use(express.static("dist"));
app.use(requestLogger);

//connect to MongoDB
mongoose.set("strictQuery", false);
console.log("Attempting to connect to MongoDB...");
mongoose
  .connect(url)
  .then(() => {
    console.log("Successfully connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
  });

// Basic route to test if server is running
app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

// Routes
app.use("/api/quizzes", quizRoutes);
app.use("/api/stats", statsRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

module.exports = app;
