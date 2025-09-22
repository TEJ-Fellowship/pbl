import jwt from "jsonwebtoken";

const roomsSnapshots = {};

export default function initSockets(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      console.error("❌ No token provided");
      return next(new Error("No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      console.error("❌ Socket auth failed:", err.message);
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id, "user:", socket.user?.id);

    socket.on("join-room", ({ roomId }, callback) => {
      socket.join(roomId);
      console.log(`${socket.user?.id} joined room ${roomId}`);
      callback?.({ ok: true, room: roomId });

      if (roomsSnapshots[roomId]) {
        socket.emit("canvas-snapshot", { dataURL: roomsSnapshots[roomId] });
      }
    });

    socket.on("begin-path", (data) => {
      socket.to([...socket.rooms]).emit("begin-path", data);
    });

    socket.on("drawing", (data) => {
      socket.to([...socket.rooms]).emit("drawing", data);
    });

    socket.on("end-path", (data) => {
      socket.to([...socket.rooms]).emit("end-path", data);
    });

    socket.on("shape", (data) => {
      socket.to([...socket.rooms]).emit("shape", data);
    });

    socket.on("clear-canvas", () => {
      socket.to([...socket.rooms]).emit("clear-canvas");
      [...socket.rooms].forEach((room) => delete roomsSnapshots[room]);
    });

    socket.on("canvas-snapshot", ({ dataURL }) => {
      [...socket.rooms].forEach((room) => {
        roomsSnapshots[room] = dataURL;
        socket.to(room).emit("canvas-snapshot", { dataURL });
      });
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });
}
