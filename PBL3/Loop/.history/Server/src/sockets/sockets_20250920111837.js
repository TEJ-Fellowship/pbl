// sockets/sockets.js
const socketio = require("socket.io");

let io;
const roomsSnapshots = {}; // store latest canvas snapshots per room

const initSockets = (server) => {
  io = socketio(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("🟢 A user connected:", socket.id);

    // --- Join room ---
    socket.on("join-room", ({ roomId }, callback) => {
      if (!roomId) {
        console.log("❌ No roomId provided by", socket.id);
        return callback({ success: false, message: "No roomId" });
      }

      socket.join(roomId);
      console.log(`✅ User ${socket.id} joined room ${roomId}`);

      callback({ success: true, message: `Joined room ${roomId}` });

      if (roomsSnapshots[roomId]) {
        socket.emit("canvas-snapshot", { dataURL: roomsSnapshots[roomId] });
      }
    });

    // --- Drawing ---
    socket.on("drawing", (data) => {
      if (data.roomId) socket.to(data.roomId).emit("drawing", data);
    });

    // --- Path begin/end ---
    socket.on("begin-path", (data) => {
      if (data.roomId) socket.to(data.roomId).emit("begin-path", data);
    });

    socket.on("end-path", (data) => {
      if (data.roomId) socket.to(data.roomId).emit("end-path", data);
    });

    // --- Shape drawing ---
    socket.on("shape", (data) => {
      if (data.roomId) socket.to(data.roomId).emit("shape", data);
    });

    // --- Clear canvas ---
    socket.on("clear-canvas", ({ roomId }) => {
      if (roomId) {
        socket.to(roomId).emit("clear-canvas");
        delete roomsSnapshots[roomId];
      }
    });

    // --- Save canvas snapshot ---
    socket.on("canvas-snapshot", ({ roomId, dataURL }) => {
      if (roomId && dataURL) {
        roomsSnapshots[roomId] = dataURL;
        socket.to(roomId).emit("canvas-snapshot", { dataURL });
      }
    });

    // --- Disconnect ---
    socket.on("disconnect", () => {
      console.log("🔴 A user disconnected:", socket.id);
    });
  });
};

module.exports = { initSockets };
