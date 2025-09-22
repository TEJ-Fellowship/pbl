// src/sockets/sockets.js
import jwt from "jsonwebtoken";

const roomsSnapshots = {}; // store latest canvas per room

export default function initSockets(io) {
  // auth middleware: accept token either in handshake.auth or handshake.query
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      console.error("Socket auth: no token provided");
      return next(new Error("No token provided"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      console.error("Socket auth failed:", err.message);
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id, "user:", socket.user?.id);

    // join room
    socket.on("join-room", ({ roomId }, callback) => {
      if (!roomId) return callback?.({ ok: false, message: "no roomId" });
      socket.join(roomId);
      console.log(`${socket.user?.id} joined room ${roomId}`);
      callback?.({ ok: true, room: roomId });

      // send last snapshot if exists
      if (roomsSnapshots[roomId]) {
        socket.emit("canvas-snapshot", { dataURL: roomsSnapshots[roomId] });
      }
    });

    // Broadcast path lifecycle events with consistent names
    socket.on("begin-path", (data) => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      rooms.forEach((room) => socket.to(room).emit("begin-path", data));
    });

    socket.on("drawing", (data) => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      rooms.forEach((room) => socket.to(room).emit("drawing", data));
    });

    socket.on("end-path", (data) => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      rooms.forEach((room) => socket.to(room).emit("end-path", data));
    });

    // shapes
    socket.on("shape", (data) => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      rooms.forEach((room) => socket.to(room).emit("shape", data));
    });

    // clear canvas
    socket.on("clear-canvas", () => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      rooms.forEach((room) => {
        socket.to(room).emit("clear-canvas");
        delete roomsSnapshots[room];
      });
    });

    // canvas snapshot (saves last snapshot per room and rebroadcasts)
    socket.on("canvas-snapshot", ({ dataURL }) => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      rooms.forEach((room) => {
        roomsSnapshots[room] = dataURL;
        socket.to(room).emit("canvas-snapshot", { dataURL });
      });
    });

    // optional cursor tracking
    socket.on("cursor", ({ x, y }) => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      rooms.forEach((room) =>
        socket.to(room).emit("cursor", { id: socket.id, x, y })
      );
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", socket.id, "reason:", reason);
    });
  });
}
