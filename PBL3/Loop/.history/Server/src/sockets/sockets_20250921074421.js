// sockets.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initSockets = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // ✅ your frontend dev server
      credentials: true,
    },
  });

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

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
