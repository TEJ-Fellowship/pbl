import websocketService from "../websocketService.js";
import { CassandraRepository } from "../../db/cassandraRepository.js";
import Redis from "ioredis";
import {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  REDIS_USERNAME,
} from "../../../config/index.js";

export const handleSocket = (io, serverId) => {
  // ✅ Accept serverId parameter
  const wsService = new websocketService(io);
  const messageRepo = new CassandraRepository();

  // Use authenticated Redis clients
  const redis = new Redis({
    host: REDIS_HOST || "localhost",
    port: REDIS_PORT || 6379,
    password: REDIS_PASSWORD,
    username: REDIS_USERNAME,
  });
  const pub = new Redis({
    host: REDIS_HOST || "localhost",
    port: REDIS_PORT || 6379,
    password: REDIS_PASSWORD,
    username: REDIS_USERNAME,
  });
  const sub = new Redis({
    host: REDIS_HOST || "localhost",
    port: REDIS_PORT || 6379,
    password: REDIS_PASSWORD,
    username: REDIS_USERNAME,
  });

  const HEARTBEAT_TTL = 30;

  sub.subscribe("user_status");

  sub.on("message", (channel, message) => {
    const data = JSON.parse(message);
    console.log(`[${serverId}] Received status update:`, data);
    wsService.statusUpdate(data.userId, data.status);
  });

  io.on("connection", async (socket) => {
    const { userId } = socket.handshake.query;

    // ✅ Add validation and error handling
    if (!userId) {
      console.error(`[${serverId}] ⚠️  Connection without userId from socket ${socket.id}`);
      socket.disconnect();
      return;
    }

    try {
      // ✅ Use dynamic serverId instead of hardcoded "server-1"
      await redis.set(`online:${userId}`, serverId, "EX", HEARTBEAT_TTL);
      
      // ✅ Verify it was set
      const verify = await redis.get(`online:${userId}`);
      if (verify) {
        console.log(`[${serverId}] ✅ User ${userId.substring(0, 8)}... set in Redis on ${serverId}`);
      } else {
        console.error(`[${serverId}] ❌ Failed to set user ${userId} in Redis`);
      }
      
      await pub.publish(
        "user_status",
        JSON.stringify({ userId, status: "online", serverId })
      );
    } catch (error) {
      console.error(`[${serverId}] ❌ Error setting user online in Redis:`, error.message);
    }

    socket.on("heartbeat", async () => {
      try {
        // ✅ Use dynamic serverId
        await redis.set(`online:${userId}`, serverId, "EX", HEARTBEAT_TTL);
      } catch (error) {
        console.error(`[${serverId}] ❌ Error updating heartbeat:`, error.message);
      }
    });

    socket.on("conversation:join", async ({ conversationId, receiver }) => {
      wsService.joinConversation(socket, conversationId);

      const isOnline = await redis.exists(`online:${receiver.user_id}`);
      const status = isOnline ? "online" : "offline";

      socket.emit("user:status", { userId: receiver.user_id, status });
      console.log(
        `[${serverId}] initial status of ${receiver.user_id}: `,
        status
      );

      const room = io.sockets.adapter.rooms.get(conversationId);
      console.log(
        `[${serverId}] 👥 Total sockets in room ${conversationId}:`,
        room?.size
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

      const room = io.sockets.adapter.rooms.get(data.conversationId);
      console.log(
        `[${serverId}] 📤 Broadcasting to ${room?.size || 0} sockets`
      );
      wsService.sendMessage(data.conversationId, savedMessage);
    });

    socket.on("typing:start", (conversationId, userId) => {
      wsService.typingStart(socket, conversationId, userId);
    });

    socket.on("typing:stop", (conversationId, userId) => {
      wsService.typingStop(socket, conversationId, userId);
    });

    socket.on("disconnect", async () => {
      await redis.del(`online:${userId}`);
      await pub.publish(
        "user_status",
        JSON.stringify({ userId, status: "offline", serverId })
      );
      wsService.removeUserSocket(userId, socket.id);
    });
  });
};
