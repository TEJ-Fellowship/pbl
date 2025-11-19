import websocketService from "../websocketService.js";
import { CassandraRepository } from "../../db/cassandraRepository.js";
import { v4 as uuid } from "uuid";
import { types } from "cassandra-driver";

export const handleSocket = (io) => {
  const wsService = new websocketService(io);
  const messageRepo = new CassandraRepository();

  io.on("connection", (socket) => {
    socket.on("conversation:join", (conversationId) => {
      wsService.joinConversation(socket, conversationId);
    });

    socket.on("message:send", async (data) => {
      const message = {
        conversationId: data.conversationId,
        messageId: uuid(),
        senderId: data.senderId,
        content: data.content,
        createdAt: new Date(),
      };

      await messageRepo.saveMessage(message);
      wsService.sendMessage(data.conversationId, message);
    });

    socket.on("typing:start", (conversationId) => {
      wsService.typingStart(conversationId, socket.id);
    });

    socket.on("typing:stop", (conversationId) => {
      wsService.typingStop(conversationId, socket.id);
    });
  });
};
