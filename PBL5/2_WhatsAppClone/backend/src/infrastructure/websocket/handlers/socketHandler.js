import websocketService from "../websocketService.js";
import { CassandraRepository } from "../../db/cassandraRepository.js";

export const handleSocket = (io) => {
  const wsService = new websocketService(io);
  const messageRepo = new CassandraRepository();

  io.on("connection", (socket) => {
    socket.on("conversation:join", (data) => {
      const conversationId =
        typeof data === "string" ? data : data.conversationId;

      wsService.joinConversation(socket, conversationId);

      console.log(`Rooms for socket ${socket.id}:`, socket.rooms); // Should show conversationId

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

      const room = io.sockets.adapter.rooms.get(data.conversationId);
      console.log(`📤 Broadcasting to ${room?.size || 0} sockets`);
      wsService.sendMessage(data.conversationId, savedMessage);
    });

    socket.on("typing:start", (conversationId) => {
      wsService.typingStart(conversationId, socket.id);
    });

    socket.on("typing:stop", (conversationId) => {
      wsService.typingStop(conversationId, socket.id);
    });
  });
};
