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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/loop", loopRoutes);
app.use("/api/userRoutes", userRoutes);

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

initSockets(io);

httpServer.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
