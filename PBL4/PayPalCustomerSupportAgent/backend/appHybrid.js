var cors = require("cors");
const express = require("express");
const config = require("./utils/config");
const logger = require("./utils/logger");
const middleware = require("./utils/middleware");
const chatControllerHybrid = require("./controllers/chatControllerHybrid");
const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(middleware.requestLogger);

// API routes - using hybrid controller
app.use("/api", chatControllerHybrid);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;