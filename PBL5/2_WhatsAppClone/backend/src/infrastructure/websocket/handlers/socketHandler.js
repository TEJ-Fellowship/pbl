import websocketService from "../websocketService.js";
import { CassandraRepository } from "../../db/cassandraRepository.js";
import Redis from "ioredis";

export const handleSocket = (io) => {
  const wsService = new websocketService(io);
  const messageRepo = new CassandraRepository();

  const redis = new Redis();
  const pub = new Redis();
  const sub = new Redis();

  const HEARTBEAT_TTL = 30;

  sub.subscribe("user_status");

  sub.on("message", (channel, message) => {
    const data = JSON.parse(message);
    console.log("status", data);
    wsService.statusUpdate(data.userId, data.status);
  });

  io.on("connection", async (socket) => {
    const { userId } = socket.handshake.query;

    //stores online status on redis
    await redis.set(`online:${userId}`, "server-1", "EX", HEARTBEAT_TTL);
    //publish online status
    await pub.publish(
      "user_status",
      JSON.stringify({ userId, status: "online" })
    );

    socket.on("heartbeat", async () => {
      await redis.set(`online:${userId}`, "server-1", "EX", HEARTBEAT_TTL);
    });

    socket.on("conversation:join", async ({ conversationId, receiver }) => {
      // const conversationId =
      //   typeof data === "object" ? data.conversationId : data;
      wsService.joinConversation(socket, conversationId);

      const isOnline = await redis.exists(`online:${receiver.user_id}`);
      const status = isOnline ? "online" : "offline";

      socket.emit("user:status", { userId: receiver.user_id, status });
      console.log(`initial status of ${receiver.user_id}: `, status);
      console.log(
        `Rooms for socket ${socket.id}:`,

        socket.rooms
      ); // Should show conversationId

      const room = io.sockets.adapter.rooms.get(conversationId);
      console.log(`👥 Total sockets in room ${conversationId}:`, room?.size);
    });

    socket.on("message:send", async (data) => {
      console.log("Message received:", data);
      const message = {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        messageType: "text",
        status: "sent",
      };

      console.log("Emitting to room:", data.conversationId);
      const savedMessage = await messageRepo.saveMessage(message);

      // Format message for frontend (convert TimeUUID to string, ensure all fields)
      const formattedMessage = {
        messageId: savedMessage.messageId?.toString() || savedMessage.messageId,
        conversationId: savedMessage.conversationId?.toString() || savedMessage.conversationId,
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

    socket.on("typing:start", (conversationId) => {
      // userId is already available from socket handshake
      wsService.typingStart(socket, conversationId, userId);
    });

    socket.on("typing:stop", (conversationId) => {
      // userId is already available from socket handshake
      wsService.typingStop(socket, conversationId, userId);
    });

    socket.on("disconnect", async () => {
      await redis.del(`online:${userId}`);
      await pub.publish(
        "user_status",
        JSON.stringify({ userId, status: "offline" })
      );
      wsService.removeUserSocket(userId, socket.id);
    });
  });
};
