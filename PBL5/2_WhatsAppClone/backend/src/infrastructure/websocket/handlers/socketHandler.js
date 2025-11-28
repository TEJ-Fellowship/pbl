import websocketService from "../websocketService.js";
import onlineStatusManager from "../onlineStatusManager.js";
import { CassandraRepository } from "../../db/cassandraRepository.js";
import { v4 as uuid } from "uuid";

export const handleSocket = (io) => {
  const wsService = new websocketService(io);
  const messageRepo = new CassandraRepository();

  io.on("connection", (socket) => {
    console.log(`New socket connection: ${socket.id}`);

    // Register user when they connect
    // Client should emit 'user:register' with { userId } after connecting
    socket.on("user:register", (data) => {
      const { userId } = data;
      if (!userId) {
        socket.emit("error", { message: "userId is required" });
        return;
      }

      // Register user as online
      const isNewlyOnline = onlineStatusManager.setUserOnline(userId, socket.id);
      
      // Store userId in socket data for later use
      socket.data.userId = userId;

      console.log(`User ${userId} registered with socket ${socket.id}`);

      // If user just came online, notify their conversations
      if (isNewlyOnline) {
        const conversations = onlineStatusManager.getUserConversations(userId);
        conversations.forEach((conversationId) => {
          wsService.emitUserOnline(conversationId, userId);
        });
      }

      // Send confirmation
      socket.emit("user:registered", { userId, isOnline: true });
    });

    // Join a conversation
    socket.on("conversation:join", (conversationId) => {
      const userId = socket.data.userId || onlineStatusManager.getUserId(socket.id);
      
      if (!userId) {
        socket.emit("error", { message: "Please register user first" });
        return;
      }

      wsService.joinConversation(socket, conversationId);
      
      // Track this conversation for the user
      onlineStatusManager.addUserToConversation(userId, conversationId);

      // Notify others in the conversation that this user is online
      if (onlineStatusManager.isUserOnline(userId)) {
        wsService.emitUserOnline(conversationId, userId);
      }
    });

    // Leave a conversation
    socket.on("conversation:leave", (conversationId) => {
      const userId = socket.data.userId || onlineStatusManager.getUserId(socket.id);
      
      wsService.leaveConversation(socket, conversationId);
      
      if (userId) {
        onlineStatusManager.removeUserFromConversation(userId, conversationId);
      }
    });

    // Send a message
    socket.on("message:send", async (data) => {
      const userId = socket.data.userId || onlineStatusManager.getUserId(socket.id);
      
      if (!userId) {
        socket.emit("error", { message: "Please register user first" });
        return;
      }

      const message = {
        conversationId: data.conversationId,
        messageId: uuid(),
        senderId: userId, // Use userId from socket data
        content: data.content,
        createdAt: new Date(),
      };

      await messageRepo.saveMessage(message);
      wsService.sendMessage(data.conversationId, message);
    });

    // Typing indicators
    socket.on("typing:start", (conversationId) => {
      const userId = socket.data.userId || onlineStatusManager.getUserId(socket.id);
      if (userId) {
        wsService.typingStart(conversationId, userId);
      }
    });

    socket.on("typing:stop", (conversationId) => {
      const userId = socket.data.userId || onlineStatusManager.getUserId(socket.id);
      if (userId) {
        wsService.typingStop(conversationId, userId);
      }
    });

    // Get online status of users in a conversation
    socket.on("user:check-online", (data) => {
      const { userIds } = data;
      if (!userIds || !Array.isArray(userIds)) {
        socket.emit("error", { message: "userIds array is required" });
        return;
      }

      const onlineStatus = {};
      userIds.forEach((userId) => {
        onlineStatus[userId] = onlineStatusManager.isUserOnline(userId);
      });

      socket.emit("user:online-status", onlineStatus);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      const userId = socket.data.userId || onlineStatusManager.getUserId(socket.id);
      
      if (userId) {
        // Remove socket connection
        const wentOffline = onlineStatusManager.setUserOffline(socket.id);
        
        // If user went completely offline, notify their conversations
        if (wentOffline) {
          const conversations = onlineStatusManager.getUserConversations(userId);
          conversations.forEach((conversationId) => {
            wsService.emitUserOffline(conversationId, userId);
          });
          
          console.log(`User ${userId} went offline`);
        }
      }
      
      console.log(`Socket ${socket.id} disconnected`);
    });
  });
};
