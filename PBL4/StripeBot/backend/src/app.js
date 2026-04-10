const express = require("express");
const chatRoutes = require("./routes/chat.routes");
const { errorMiddleware } = require("./middlewares/error.middleware");
const ragRoutes = require("./routes/rag.routes");
const cors = require("cors");

// Create an Express application instance
const app = express();

//CORS configuration to allow requests from the frontend
app.use(
  cors({
    origin: "http://localhost:5173",
  })
)

//Parse incoming JSON into JavaScript object  and attaches it to req.body
app.use(express.json());

// Define routes for the chat API
app.use("/api/chat", chatRoutes);
app.use("/api/rag", ragRoutes);

// Handle errors centrally using custom middleware
app.use(errorMiddleware);

module.exports = app;
