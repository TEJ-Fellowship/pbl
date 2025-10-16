var cors = require("cors");
const express = require("express");
const config = require("./utils/config");
const logger = require("./utils/logger");
const middleware = require("./utils/middleware");
const chatControllerHybrid = require("./controllers/chatControllerHybrid");
const app = express();

app.use(
  cors({
    origin: true, // Allow all origins for development
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  })
);

// CORS is handled by the cors middleware above

app.use(express.json());
app.use(middleware.requestLogger);

// API routes - using hybrid controller
app.use("/api", chatControllerHybrid);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;