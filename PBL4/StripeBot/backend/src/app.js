const express = require("express");
const chatRoutes = require("./routes/chat.routes");
const app = express();

app.use(express.json());

app.use("/api/chat", chatRoutes);

module.exports = app;
