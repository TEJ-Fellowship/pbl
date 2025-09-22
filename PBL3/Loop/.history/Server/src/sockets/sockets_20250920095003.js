import jwt from "jsonwebtoken";

const roomsSnapshots = {}; // store latest canvas per room

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

    // Join room
    socket.on("join-room", ({ roomId }, callback) => {
      socket.join(roomId);
      console.log(`${socket.user?.id} joined room ${roomId}`);
      callback({ ok: true, room: roomId });

      // send last snapshot to this user
      if (roomsSnapshots[roomId]) {
        socket.emit("canvas-snapshot", { dataURL: roomsSnapshots[roomId] });
      }
    });

    // Real-time drawing
    socket.on("drawing", (data) => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      rooms.forEach((room) => socket.to(room).emit("drawing", data));
    });
    

    // Shapes
    socket.on("shape", (data) => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      rooms.forEach((room) => socket.to(room).emit("shape", data));
    });

    // Clear canvas
    socket.on("clear-canvas", () => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      rooms.forEach((room) => socket.to(room).emit("clear-canvas"));
      // clear stored snapshot
      rooms.forEach((room) => delete roomsSnapshots[room]);
    });

    // Canvas snapshot
    socket.on("canvas-snapshot", ({ dataURL }) => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      rooms.forEach((room) => {
        roomsSnapshots[room] = dataURL; // save latest snapshot
        socket.to(room).emit("canvas-snapshot", { dataURL });
      });
    });

    // Optional: cursor tracking
    socket.on("cursor", ({ x, y }) => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      rooms.forEach((room) => socket.to(room).emit("cursor", { id: socket.id, x, y }));
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });
}
