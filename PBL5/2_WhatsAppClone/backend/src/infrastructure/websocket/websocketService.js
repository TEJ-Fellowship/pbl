// WebSocket server

class websocketService {
  constructor(io) {
    this.io = io;
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

  statusUpdate(conversationId, messageId, status) {
    this.io.to(conversationId).emit("status:update", { messageId, status });
  }
}

export default websocketService;
