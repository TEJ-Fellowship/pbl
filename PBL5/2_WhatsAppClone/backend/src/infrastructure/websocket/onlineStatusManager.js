// Online status manager - tracks which users are online
// Uses in-memory storage (can be replaced with Redis for multi-server setup)

class OnlineStatusManager {
  constructor() {
    // Map: userId -> Set of socketIds (user can have multiple connections)
    this.onlineUsers = new Map();
    
    // Map: socketId -> userId
    this.socketToUser = new Map();
    
    // Map: userId -> Set of conversationIds (to notify relevant conversations)
    this.userConversations = new Map();
  }

  // Register a user as online
  setUserOnline(userId, socketId) {
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId).add(socketId);
    this.socketToUser.set(socketId, userId);
    
    return this.onlineUsers.get(userId).size === 1; // Returns true if user just came online
  }

  // Remove a socket connection
  setUserOffline(socketId) {
    const userId = this.socketToUser.get(socketId);
    if (!userId) return null;

    const userSockets = this.onlineUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      
      // If user has no more active connections, mark as offline
      if (userSockets.size === 0) {
        this.onlineUsers.delete(userId);
        this.socketToUser.delete(socketId);
        return userId; // Return userId to notify others
      }
    }
    
    this.socketToUser.delete(socketId);
    return null; // User still has other connections
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.onlineUsers.has(userId) && this.onlineUsers.get(userId).size > 0;
  }

  // Get all online users
  getOnlineUsers() {
    return Array.from(this.onlineUsers.keys());
  }

  // Add user to conversation tracking
  addUserToConversation(userId, conversationId) {
    if (!this.userConversations.has(userId)) {
      this.userConversations.set(userId, new Set());
    }
    this.userConversations.get(userId).add(conversationId);
  }

  // Remove user from conversation tracking
  removeUserFromConversation(userId, conversationId) {
    const conversations = this.userConversations.get(userId);
    if (conversations) {
      conversations.delete(conversationId);
      if (conversations.size === 0) {
        this.userConversations.delete(userId);
      }
    }
  }

  // Get all conversations a user is part of
  getUserConversations(userId) {
    return Array.from(this.userConversations.get(userId) || []);
  }

  // Get userId from socketId
  getUserId(socketId) {
    return this.socketToUser.get(socketId);
  }
}

// Singleton instance
const onlineStatusManager = new OnlineStatusManager();

export default onlineStatusManager;

