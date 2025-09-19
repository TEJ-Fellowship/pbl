// backend/socket.js
const { Server } = require("socket.io");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Handle Socket.IO connections
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Join a room
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Leave a room
    socket.on("leaveRoom", (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    // handle new message
    socket.on("message", (msg) => {
      // msg = { _id, clipUrl, roomId, isOwner }
      const roomId = msg.roomId;
      // broadcast to everyone in the room except sender
      socket.to(roomId).emit("newMessage", { ...msg, isOwner: false });
      console.log(`Broadcasting new message to room ${roomId}`);
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

module.exports = { initSocket };
