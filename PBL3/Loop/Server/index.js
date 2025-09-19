import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server as IOServer } from "socket.io";

import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import roomRoutes from "./src/routes/roomRoutes.js";
import loopRoutes from "./src/routes/loopRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import drawingRoutes from "./src/routes/drawingRoutes.js";

dotenv.config({ path: "./src/.env" });
connectDB();

const app = express();
const server = http.createServer(app);
const io = new IOServer(server, {
  cors: { origin: "http://localhost:5173", credentials: true },
});

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/loop", loopRoutes);
app.use("/api/userRoutes", userRoutes);
app.use("/api/drawings", drawingRoutes);

app.get("/", (req, res) => res.json({ ok: true }));

// ------------------- Socket.IO -------------------
const rooms = {}; 
// rooms[roomId] = { users: [{socketId, userId, username, avatar}], currentIndex, timer, interval }

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinRoom", ({ roomId, userId, username, avatar }) => {
    if (!roomId) return;
    socket.join(roomId);

    if (!rooms[roomId]) rooms[roomId] = { users: [], currentIndex: 0, timer: 30, interval: null };

    if (!rooms[roomId].users.some(u => u.userId === userId)) {
      rooms[roomId].users.push({ socketId: socket.id, userId, username, avatar });
    }

    io.to(roomId).emit("roomUsers", rooms[roomId].users);

    if (rooms[roomId].users.length === 1) startTurn(roomId);
  });

  socket.on("leaveRoom", ({ roomId }) => {
    if (!rooms[roomId]) return;
    rooms[roomId].users = rooms[roomId].users.filter(u => u.socketId !== socket.id);
    io.to(roomId).emit("roomUsers", rooms[roomId].users);

    if (!rooms[roomId].users.length) {
      clearInterval(rooms[roomId].interval);
      delete rooms[roomId];
    }
  });

  // Drawing events
  socket.on("stroke:new", (payload) => {
    if (!payload?.roomId) return;
    socket.to(payload.roomId).emit("stroke:created", payload);
  });

  socket.on("stroke:delete", ({ roomId, strokeId }) => {
    if (!roomId) return;
    socket.to(roomId).emit("stroke:deleted", { strokeId });
  });

  // Cursor updates
  socket.on("cursor:update", (payload) => {
    if (!payload?.roomId) return;
    socket.to(payload.roomId).emit("cursor:updated", payload);
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      rooms[roomId].users = rooms[roomId].users.filter(u => u.socketId !== socket.id);
      io.to(roomId).emit("roomUsers", rooms[roomId].users);
      if (!rooms[roomId].users.length) {
        clearInterval(rooms[roomId].interval);
        delete rooms[roomId];
      }
    }
  });
});

// ------------------- Turn Timer -------------------
function startTurn(roomId) {
  const room = rooms[roomId];
  if (!room || !room.users.length) return;

  if (room.interval) clearInterval(room.interval);

  room.timer = 30;
  const currentUser = room.users[room.currentIndex];

  io.to(roomId).emit("turn:started", { userId: currentUser.userId, username: currentUser.username, avatar: currentUser.avatar, duration: room.timer });

  room.interval = setInterval(() => {
    room.timer -= 1;
    io.to(roomId).emit("turn:update", { remaining: room.timer });

    if (room.timer <= 0) {
      clearInterval(room.interval);
      room.currentIndex = (room.currentIndex + 1) % room.users.length;
      startTurn(roomId);
    }
  }, 1000);
}

app.set("io", io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
