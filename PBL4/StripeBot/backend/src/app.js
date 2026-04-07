const express = require("express");
const chatRoutes = require("./routes/chat.routes");
const { errorMiddleware } = require("./middlewares/error.middleware");

// Create an Express application instance
const app = express();

//Parse incoming JSON into JavaScript object  and attaches it to req.body
app.use(express.json());

// Define routes for the chat API
app.use("/api/chat", chatRoutes);

// Handle errors centrally using custom middleware
app.use(errorMiddleware);

module.exports = app;
