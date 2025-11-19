// WebSocket server

class websocketService {
  constructor(io) {
    this.io = io;
  }

  joinConversation(socket, conversationId) {
    socket.join(conversationId);
    console.log(socket.id);
  }

  leaveConversation(socket, conversationId) {
    socket.leave(conversationId);
    console.log(socket.id);
  }

  sendMessage(conversationId, message) {
    this.io.to(conversationId).emit("message:receive", message);
  }

  typingStart(conversationId, userId) {
    this.io.to(conversationId).emit("typing:start", userId);
  }

  typingStop(conversationId, userId) {
    this.io.to(conversationId).emit("typing:stop", userId);
  }

  statusUpdate(conversationId, messageId, status) {
    this.io.to(conversationId).emit("status:update", { messageId, status });
  }
}

export default websocketService;
