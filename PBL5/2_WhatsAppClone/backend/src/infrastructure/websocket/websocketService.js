// WebSocket server

class websocketService {
  constructor(io) {
    this.io = io;
  }

  joinConversation(socket, conversationId) {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  }

  leaveConversation(socket, conversationId) {
    socket.leave(conversationId);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
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

  // Emit user online status to a conversation
  emitUserOnline(conversationId, userId) {
    this.io.to(conversationId).emit("user:online", { userId });
  }

  // Emit user offline status to a conversation
  emitUserOffline(conversationId, userId) {
    this.io.to(conversationId).emit("user:offline", { userId });
  }

  // Emit online status to a specific socket
  emitOnlineStatus(socket, userId, isOnline) {
    socket.emit("user:status", { userId, isOnline });
  }
}

export default websocketService;
