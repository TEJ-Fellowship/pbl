// index.js
import express from "express";
import http from "http";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { initSockets } from "./sockets.js";

dotenv.config({ path: "./src/.env" });

const app = express();
const server = http.createServer(app);

// init sockets
initSockets(server);

// connect db
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
