var cors = require("cors");
const express = require("express");
const config = require("./utils/config");
const logger = require("./utils/logger");
const middleware = require("./utils/middleware");
const chatController = require("./controllers/chatController");
const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173", 
      "http://127.0.0.1:5173",
      "http://localhost:5174", 
      "http://127.0.0.1:5174",
      "http://localhost:5175", 
      "http://127.0.0.1:5175",
      "http://localhost:5176", 
      "http://127.0.0.1:5176"
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(middleware.requestLogger);

// API routes
app.use("/api", chatController);


app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;