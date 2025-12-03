// Message controller

import { CassandraRepository } from "../../infrastructure/db/cassandraRepository.js";
import { Conversation } from "../../infrastructure/db/postgresRepository.js";
import { sequelize } from "../../config/postgres.js";
import { v4 as uuid } from "uuid";
import { Op } from "sequelize";

const messageRepo = new CassandraRepository();

export const initiateConversation = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: "Missing senderId or receiverId" });
    }

    // Sort user IDs to guarantee uniqueness
    const [user1, user2] = [senderId, receiverId].sort();

    // Check if conversation already exists between them
    let conversation = await Conversation.findOne({
      where: {
        [Op.or]: [
          { user1_id: user1, user2_id: user2 },
          { user1_id: user2, user2_id: user1 },
        ],
      },
    });

    // Create if not found
    if (!conversation) {
      conversation = await Conversation.create({
        conversation_id: uuid(),
        user1_id: user1,
        user2_id: user2,
      });
    }

    res.json({
      message: "Conversation ready",
      data: {
        conversationId: conversation.conversation_id,
        user1Id: conversation.user1_id,
        user2Id: conversation.user2_id,
      },
    });
  } catch (err) {
    console.error("Initiate conversation error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit) || 50; // Allow custom limit via query parameter

    const messages = await messageRepo.getMessages(conversationId, limit);

    // Format messages for better readability
    const formattedMessages = messages.map((msg) => ({
      messageId: msg.message_id?.toString(),
      conversationId: msg.conversation_id?.toString(),
      senderId: msg.sender_id?.toString(),
      content: msg.content,
      messageType: msg.message_type,
      status: msg.status,
      createdAt: msg.created_at,
    }));

    res.json({
      message: "Messages retrieved successfully",
      conversationId: conversationId,
      count: formattedMessages.length,
      data: formattedMessages,
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    res
      .status(500)
      .json({ error: "Failed to get messages", details: error.message });
  }
};

// Get all conversations for a user
export const getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find conversations where user is either user1 or user2
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [{ user1_id: userId }, { user2_id: userId }],
      },
      order: [["last_message_time", "DESC"]], // Most recent conversations first
    });

    const formattedConversations = conversations.map((conv) => ({
      conversationId: conv.conversation_id,
      user1Id: conv.user1_id,
      user2Id: conv.user2_id,
      lastMessageId: conv.last_message_id,
      lastMessageText: conv.last_message_text,
      lastMessageTime: conv.last_message_time,
      lastMessageSenderId: conv.last_message_sender_id,
      createdAt: conv.created_at,
    }));

    res.json({
      message: "Conversations retrieved successfully",
      userId: userId,
      count: formattedConversations.length,
      data: formattedConversations,
    });
  } catch (error) {
    console.error("Error getting conversations:", error);
    res.status(500).json({
      error: "Failed to get conversations",
      details: error.message,
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    let { conversationId, senderId, receiverId, content, messageType, status } =
      req.body;

    if (!senderId || !receiverId || !content) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["senderId", "receiverId", "content"],
        optional: ["conversationId"],
      });
    }

    // If no conversationId → find or create it
    if (!conversationId) {
      const [user1, user2] = [senderId, receiverId].sort();

      let existing = await Conversation.findOne({
        where: {
          [Op.or]: [
            { user1_id: user1, user2_id: user2 },
            { user1_id: user2, user2_id: user1 },
          ],
        },
      });

      if (existing) {
        conversationId = existing.conversation_id;
      } else {
        conversationId = uuid();
        await Conversation.create({
          conversation_id: conversationId,
          user1_id: user1,
          user2_id: user2,
        });
      }
    }

    // Save message in Cassandra
    const savedMessage = await messageRepo.saveMessage({
      conversationId,
      senderId,
      content,
      messageType: messageType || "text",
      status: status || "sent",
    });

    const messageId = savedMessage.messageId.toString();

    // Update conversation metadata in Postgres
    await Conversation.update(
      {
        last_message_id: messageId,
        last_message_text: content,
        last_message_time: savedMessage.createdAt,
        last_message_sender_id: senderId,
      },
      { where: { conversation_id: conversationId } }
    );

    res.json({
      message: "Message sent successfully",
      data: {
        ...savedMessage,
        messageId,
        conversationId,
        receiverId,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: error.message });
  }
};
