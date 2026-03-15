// loopSockets.js
const { Server } = require("socket.io");

let io;

function initSockets(server) {
  io = new Server(server, {
    cors: {
      origin: "*", // Update this in production
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Join a room
    socket.on("joinRoom", (roomCode) => {
      socket.join(roomCode);
      console.log(`${socket.id} joined room ${roomCode}`);
      io.to(roomCode).emit("userJoined", { id: socket.id });
    });

    // Canvas updates
    socket.on("canvasUpdate", ({ roomCode, data }) => {
      // Broadcast update to all other clients in the same room
      socket.to(roomCode).emit("canvasUpdate", data);
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
}

module.exports = { initSockets };
