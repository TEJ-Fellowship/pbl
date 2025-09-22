import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { registerSockets } from "./sockets.js";

dotenv.config(); // 👈 no path needed, will load from Server/.env

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// WebSocket
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

registerSockets(io);

httpServer.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
