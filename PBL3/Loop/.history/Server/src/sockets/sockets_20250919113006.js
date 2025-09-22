// src/sockets.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // your frontend origin
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // -------------------- AUTH --------------------
    const token = socket.handshake.auth?.token;
    if (!token) {
      console.log("Socket auth failed: no token");
      socket.disconnect();
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // store user info
      console.log("Socket authenticated:", decoded.id);
    } catch (err) {
      console.log("Socket auth failed: jwt malformed");
      socket.disconnect();
      return;
    }

    // -------------------- JOIN ROOM --------------------
    socket.on("join-room", ({ roomId }, callback) => {
      if (!roomId) return callback({ ok: false, message: "No roomId provided" });
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      callback({ ok: true, room: roomId });
    });

    // -------------------- DRAWING --------------------
    socket.on("drawing", (data) => {
      if (!data || !data.start || !data.end) return;
      // broadcast to others in room
      const rooms = Array.from(socket.rooms);
      rooms.forEach((room) => {
        if (room !== socket.id) socket.to(room).emit("drawing", data);
      });
    });

    // -------------------- SHAPES --------------------
    socket.on("shape", (data) => {
      const rooms = Array.from(socket.rooms);
      rooms.forEach((room) => {
        if (room !== socket.id) socket.to(room).emit("shape", data);
      });
    });

    // -------------------- CLEAR CANVAS --------------------
    socket.on("clear-canvas", () => {
      const rooms = Array.from(socket.rooms);
      rooms.forEach((room) => {
        if (room !== socket.id) socket.to(room).emit("clear-canvas");
      });
    });

    // -------------------- CANVAS SNAPSHOT --------------------
    socket.on("canvas-snapshot", (data) => {
      const rooms = Array.from(socket.rooms);
      rooms.forEach((room) => {
        if (room !== socket.id) socket.to(room).emit("canvas-snapshot", data);
      });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
};
