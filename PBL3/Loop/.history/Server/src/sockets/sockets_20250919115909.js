import jwt from "jsonwebtoken";

export default function initSockets(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));

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

    // ------------------ Join room ------------------
    socket.on("join-room", ({ roomId }, callback) => {
      socket.join(roomId);
      console.log(`${socket.user?.id} joined room ${roomId}`);
      callback({ ok: true, room: roomId });
    });

    // ------------------ Drawing ------------------
    socket.on("drawing", (data) => {
      const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
      rooms.forEach(room => {
        socket.to(room).emit("drawing", data);
      });
    });

    // ------------------ Shape ------------------
    socket.on("shape", (data) => {
      const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
      rooms.forEach(room => {
        socket.to(room).emit("shape", data);
      });
    });

    // ------------------ Clear canvas ------------------
    socket.on("clear-canvas", () => {
      const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
      rooms.forEach(room => {
        socket.to(room).emit("clear-canvas");
      });
    });

    // ------------------ Canvas snapshot ------------------
    socket.on("canvas-snapshot", ({ dataURL }) => {
      const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
      rooms.forEach(room => {
        socket.to(room).emit("canvas-snapshot", { dataURL });
      });
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });
}
