// WebSocket server

class websocketService {
  constructor(io) {
    this.io = io;
    this.localSockets = {};
  }

  joinConversation(socket, conversationId) {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`); // ✅ Fixed
    socket.to(conversationId).emit("conversation:join", conversationId);
  }

  leaveConversation(socket, conversationId) {
    socket.leave(conversationId);
    console.log(socket.id);
  }

  sendMessage(conversationId, message) {
    this.io.to(conversationId).emit("message:send", message);
  }

  typingStart(socket, conversationId, userId) {
    socket.to(conversationId).emit("typing:start", userId);
  }

  typingStop(socket, conversationId, userId) {
    socket.to(conversationId).emit("typing:stop", userId);
  }
  1;

  statusUpdate(userId, status) {
    if (status === "online") {
      this.localSockets[userId] = this.localSockets[userId] || new Set();
    }
    this.io.emit("user:status", { userId, status });
  }

  removeUserSocket(userId, socketId) {
    if (this.localSockets[userId]) {
      this.localSockets[userId].delete(socketId);
      if (this.localSockets[userId].size === 0) {
        delete this.localSockets[userId];
      }
    }
  }
}

export default websocketService;
