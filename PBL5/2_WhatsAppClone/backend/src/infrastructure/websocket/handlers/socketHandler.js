import websocketService from "../websocketService.js";
import { CassandraRepository } from "../../db/cassandraRepository.js";
import { Conversation } from "../../db/postgresRepository.js"; // ✅ Add this import

import { redis, createAppSubscriber } from "../../../config/redis.js";
import {
  markMessageDelivered,
  markMessagesAsRead,
  markMessageSent,
} from "../../../application/messageStatusService.js";
import {
  getGroupMembers,
  getGroupConversationId,
} from "../../../application/groupService.js";

export const handleSocket = async (io, serverId) => {
  // ✅ Accept serverId parameter
  const wsService = new websocketService(io);
  const messageRepo = new CassandraRepository();

  const HEARTBEAT_TTL = 30;

  const appSub = await createAppSubscriber();

  await appSub.subscribe("user_status", (message) => {
    try {
      // ✅ Add null check
      if (!message) {
        console.warn(`[${serverId}] Received null/empty user_status message`);
        return;
      }

      const data = JSON.parse(message);

      // ✅ Add validation
      if (!data || !data.userId) {
        console.warn(`[${serverId}] Invalid user_status message format:`, data);
        return;
      }

      console.log(`[${serverId}] [user_status] Received status update:`, data);
      // update presence UI across connected sockets
      wsService.statusUpdate(data.userId, data.status);
    } catch (err) {
      console.error(
        `[${serverId}] Failed to parse user_status message:`,
        err && err.message
      );
    }
  });

  redis.on("error", (err) => {
    console.error(`[${serverId}] redis error:`, err && err.message);
  });

  io.on("connection", async (socket) => {
    const { userId } = socket.handshake.query;

    // ✅ Add validation and error handling
    if (!userId) {
      console.error(
        `[${serverId}] ⚠️  Connection without userId from socket ${socket.id}`
      );
      socket.disconnect();
      return;
    }

    try {
      // ✅ Use dynamic serverId instead of hardcoded "server-1"
      await redis.set(`online:${userId}`, serverId, "EX", HEARTBEAT_TTL);

      // ✅ Verify it was set
      const verify = await redis.get(`online:${userId}`);
      if (verify) {
        console.log(
          `[${serverId}] ✅ User ${userId.substring(
            0,
            8
          )}... set in Redis on ${serverId}`
        );
      } else {
        console.error(`[${serverId}] ❌ Failed to set user ${userId} in Redis`);
      }

      await redis.publish(
        "user_status",
        JSON.stringify({ userId, status: "online", serverId })
      );
    } catch (error) {
      console.error(
        `[${serverId}] ❌ Error setting user online in Redis:`,
        error.message
      );
    }

    socket.on("heartbeat", async () => {
      try {
        // ✅ Use dynamic serverId
        await redis.set(`online:${userId}`, serverId, "EX", HEARTBEAT_TTL);
      } catch (error) {
        console.error(
          `[${serverId}] ❌ Error updating heartbeat:`,
          error.message
        );
      }
    });
    // Track which conversation each socket is currently in
    const socketConversations = new Map(); // socketId -> conversationId

    socket.on("conversation:join", async ({ conversationId, receiver }) => {
      const userId = socket.handshake.query.userId;

      // ✅ Leave previous conversation room if exists
      const previousConversationId = socketConversations.get(socket.id);
      if (previousConversationId && previousConversationId !== conversationId) {
        socket.leave(previousConversationId);
        console.log(
          `[${serverId}] Socket ${socket.id} left conversation ${previousConversationId}`
        );
      }

      // ✅ Join new conversation room
      wsService.joinConversation(socket, conversationId);
      socketConversations.set(socket.id, conversationId);

      // If receiver object present -> check online
      try {
        const isOnline = receiver?.user_id
          ? await redis.exists(`online:${receiver.user_id}`)
          : 0;
        const status = isOnline ? "online" : "offline";
        socket.emit("user:status", { userId: receiver?.user_id, status });
        console.log(
          `[${serverId}] User ${userId} joined conversation ${conversationId}, previous: ${
            previousConversationId || "none"
          }`
        );
        const room = io.sockets.adapter.rooms.get(conversationId);
        console.log(
          `[${serverId}] 👥 Total sockets in room ${conversationId}:`,
          room?.size || 0
        );
      } catch (err) {
        console.error(
          `[${serverId}] error while checking status:`,
          err && err.message
        );
      }
    });

    socket.on("conversation:leave", ({ conversationId }) => {
      const userId = socket.handshake.query.userId;
      socket.leave(conversationId);
      socketConversations.delete(socket.id);
      console.log(
        `[${serverId}] User ${userId} left conversation ${conversationId}`
      );
    });

    socket.on("message:send", async (data) => {
      console.log(`[${serverId}] Message received:`, data);
      const message = {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        messageType: "text",
        status: "sent",
      };

      console.log(`[${serverId}] Emitting to room:`, data.conversationId);
      const savedMessage = await messageRepo.saveMessage(message);

      // Format message for frontend (convert TimeUUID to string, ensure all fields)
      const formattedMessage = {
        messageId: savedMessage.messageId?.toString() || savedMessage.messageId,
        conversationId:
          savedMessage.conversationId?.toString() ||
          savedMessage.conversationId,
        senderId: savedMessage.senderId?.toString() || savedMessage.senderId,
        content: savedMessage.content,
        messageType: savedMessage.messageType || "text",
        status: savedMessage.status || "sent",
        createdAt: savedMessage.createdAt || new Date(),
      };

      const room = io.sockets.adapter.rooms.get(data.conversationId);
      console.log(`📤 Broadcasting to ${room?.size || 0} sockets`);

      // Broadcast to all sockets in the room (including sender)
      wsService.sendMessage(data.conversationId, formattedMessage);
    });

    // Handle message received (delivered status)
    socket.on("message:received", async (data) => {
      try {
        const { messageId, conversationId } = data;
        const userId = socket.handshake.query.userId;

        if (!messageId || !conversationId) {
          console.warn(`[${serverId}] Invalid message:received data:`, data);
          return;
        }

        await markMessageDelivered(messageId, conversationId, userId);
        console.log(
          `[${serverId}] Message ${messageId} marked as delivered for user ${userId}`
        );
      } catch (error) {
        console.error(
          `[${serverId}] Error marking message as delivered:`,
          error.message
        );
      }
    });

    // Handle conversation opened (read status)
    socket.on("conversation:open", async (data) => {
      try {
        const { conversationId, lastReadMessageId } = data;
        const userId = socket.handshake.query.userId;

        if (!conversationId || !lastReadMessageId) {
          console.warn(`[${serverId}] Invalid conversation:open data:`, data);
          return;
        }

        await markMessagesAsRead(conversationId, userId, lastReadMessageId);
        console.log(
          `[${serverId}] Messages marked as read for user ${userId} in conversation ${conversationId}`
        );
      } catch (error) {
        console.error(
          `[${serverId}] Error marking messages as read:`,
          error.message
        );
      }
    });

    // Handle group conversation join
    socket.on("group:join", async (data) => {
      try {
        const { groupId } = data;
        const userId = socket.handshake.query.userId;

        if (!groupId) {
          console.warn(`[${serverId}] Invalid group:join data:`, data);
          return;
        }

        // Get conversation ID for group
        const conversationId = await getGroupConversationId(groupId);
        if (conversationId) {
          wsService.joinConversation(socket, conversationId);
          console.log(`[${serverId}] User ${userId} joined group ${groupId}`);
        }
      } catch (error) {
        console.error(`[${serverId}] Error joining group:`, error.message);
      }
    });

    // Update message:send to handle groups
    // Replace the existing message:send handler with this:
    socket.on("message:send", async (data) => {
      console.log(`[${serverId}] Message received:`, data);
      const message = {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        messageType: data.messageType || "text",
        status: "sent",
      };

      console.log(`[${serverId}] Emitting to room:`, data.conversationId);
      const savedMessage = await messageRepo.saveMessage(message);

      // Format message for frontend
      const formattedMessage = {
        messageId: savedMessage.messageId?.toString() || savedMessage.messageId,
        conversationId:
          savedMessage.conversationId?.toString() ||
          savedMessage.conversationId,
        senderId: savedMessage.senderId?.toString() || savedMessage.senderId,
        content: savedMessage.content,
        messageType: savedMessage.messageType || "text",
        status: savedMessage.status || "sent",
        createdAt: savedMessage.createdAt || new Date(),
      };

      // Check if it's a group conversation
      const conversation = await Conversation.findOne({
        where: { conversation_id: data.conversationId },
      });

      if (conversation && conversation.conversation_type === "group") {
        // For groups, get all members and mark message as sent
        const members = await getGroupMembers(conversation.group_id);
        const recipientIds = members
          .map((m) => m.user_id)
          .filter((id) => id !== data.senderId);

        // Mark as sent for all members (this will publish to Kafka)
        await markMessageSent(
          formattedMessage.messageId,
          data.conversationId,
          data.senderId,
          [data.senderId, ...recipientIds]
        );
      } else {
        // For direct messages, mark as sent for sender and receiver
        const receiverId = data.receiverId;
        if (receiverId) {
          await markMessageSent(
            formattedMessage.messageId,
            data.conversationId,
            data.senderId,
            [data.senderId, receiverId]
          );
        }
      }

      const room = io.sockets.adapter.rooms.get(data.conversationId);
      console.log(`📤 Broadcasting to ${room?.size || 0} sockets`);

      // Broadcast to all sockets in the room
      wsService.sendMessage(data.conversationId, formattedMessage);
    });

    socket.on("typing:start", (conversationId) => {
      // userId is already available from socket handshake
      wsService.typingStart(socket, conversationId, userId);
    });

    socket.on("typing:stop", (conversationId) => {
      // userId is already available from socket handshake
      wsService.typingStop(socket, conversationId, userId);
    });

    socket.on("disconnect", async () => {
      try {
        // ✅ Clean up conversation tracking
        const conversationId = socketConversations.get(socket.id);
        if (conversationId) {
          socket.leave(conversationId);
          socketConversations.delete(socket.id);
          console.log(
            `[${serverId}] Socket ${socket.id} disconnected from conversation ${conversationId}`
          );
        }

        await redis.del(`online:${userId}`);
        await redis.publish(
          "user_status",
          JSON.stringify({ userId, status: "offline", serverId })
        );
      } catch (err) {
        console.error(
          `[${serverId}] error during disconnect for ${userId}:`,
          err && err.message
        );
      } finally {
        wsService.removeUserSocket(userId, socket.id);
      }
    });
  });
};
