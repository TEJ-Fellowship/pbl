// index.js
import express from "express";
import http from "http";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

dotenv.config({ path: "./src/.env" });

const app = express();
const server = http.createServer(app);

// --- SOCKET.IO SETUP ---
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // ✅ your frontend dev server
    credentials: true,
  },
});

// middleware for socket auth
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      console.warn("❌ No token provided");
      return next(new Error("Authentication error"));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    console.log("✅ Authenticated socket:", decoded.id);
    next();
  } catch (err) {
    console.error("❌ Socket auth failed:", err.message);
    next(new Error("Authentication error"));
  }
});

// socket events
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("join-room", ({ roomId }, cb) => {
    socket.join(roomId);
    cb && cb({ ok: true, room: roomId });
    console.log(`📢 ${socket.id} joined room ${roomId}`);
  });

  socket.on("drawing", (data) => {
    socket.to(data.roomId).emit("drawing", data);
  });

  socket.on("begin-path", (data) => {
    socket.to(data.roomId).emit("begin-path", { ...data, from: socket.id });
  });

  socket.on("end-path", (data) => {
    socket.to(data.roomId).emit("end-path", { ...data, from: socket.id });
  });

  socket.on("shape", (data) => {
    socket.to(data.roomId).emit("shape", data);
  });

  socket.on("clear-canvas", ({ roomId }) => {
    socket.to(roomId).emit("clear-canvas");
  });

  socket.on("canvas-snapshot", ({ dataURL, roomId }) => {
    socket.to(roomId).emit("canvas-snapshot", { dataURL });
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// --- DATABASE CONNECTION ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

// --- START SERVER ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
