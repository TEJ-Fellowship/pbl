var cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const config = require("./utils/config");
const logger = require("./utils/logger");
const middleware = require("./utils/middleware");

// Import routers with debugging
const usersRoutes = require("./controllers/users");
const clipsRouter = require("./controllers/clips");
const montageRouter = require("./controllers/montage");
const musicRouter = require("./controllers/music");
const loginRouter = require("./controllers/login");
const geminiRouter = require('./controllers/gemini')

// DEBUG: Check which router is undefined
console.log("🔍 Router Debug:");
console.log("usersRoutes:", typeof usersRoutes, usersRoutes ? "✅" : "❌");
console.log("clipsRouter:", typeof clipsRouter, clipsRouter ? "✅" : "❌");
console.log("montageRouter:", typeof montageRouter, montageRouter ? "✅" : "❌");
console.log("musicRouter:", typeof musicRouter, musicRouter ? "✅" : "❌");
console.log("loginRouter:", typeof loginRouter, loginRouter ? "✅" : "❌");

const app = express();
app.use(cors());
logger.info("connecting to", config.MONGODB_URI);

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info("connected to MongoDB");
  })
  .catch((error) => {
    logger.error("error connection to MongoDB:", error.message);
  });

app.use(express.json());
app.use(middleware.requestLogger);
app.use(middleware.tokenExtractor);

// Use routers (the error happens here)
app.use("/api/users", usersRoutes);
app.use("/api/login", loginRouter);
app.use("/api/clips", clipsRouter);
app.use("/api/montage", montageRouter);
app.use("/api/gemini", geminiRouter)
app.use("/api/music", musicRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;