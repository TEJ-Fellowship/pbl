const express = require("express");
const chatRoutes = require("./routes/chat.routes");
const { errorMiddleware } = require("./middlewares/error.middleware");

const app = express();

app.use(express.json());

app.use("/api/chat", chatRoutes);

app.use(errorMiddleware);

module.exports = app;
