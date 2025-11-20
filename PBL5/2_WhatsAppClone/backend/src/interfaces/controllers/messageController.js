// Message controller

import { CassandraRepository } from "../../infrastructure/db/cassandraRepository.js";
import { Conversation } from "../../infrastructure/db/postgresRepository.js";
import { sequelize } from "../../config/postgres.js";
import { v4 as uuid } from "uuid";
import { Op } from "sequelize";

const messageRepo = new CassandraRepository();

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
    res.status(500).json({ error: "Failed to get messages", details: error.message });
  }
};

// Get all conversations for a user
export const getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find conversations where user is either user1 or user2
    const conversations = await Conversation.findAll({
      where: {
        [sequelize.Op.or]: [
          { user1_id: userId },
          { user2_id: userId },
        ],
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
    let { conversationId, senderId, content, messageType, status, receiverId } = req.body;

    // Validate required fields
    if (!senderId || !content || !receiverId) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["senderId", "content", "receiverId"],
        optional: ["conversationId"], // conversationId is optional, will be auto-generated if not provided
      });
    }

    // Auto-generate conversationId if not provided
    if (!conversationId) {
      conversationId = uuid();
    }

    // Save message to Cassandra
    const savedMessage = await messageRepo.saveMessage({
      conversationId,
      senderId,
      content,
      messageType: messageType || "text",
      status: status || "sent",
    });

    // Convert messageId (TimeUuid) to string for PostgreSQL
    const messageIdString = savedMessage.messageId.toString();

    // Find or create conversation in PostgreSQL
    // Ensure consistent ordering: smaller UUID string first
    const sortedUserIds = [senderId, receiverId].sort();
    const [conversation, created] = await Conversation.findOrCreate({
      where: {
        conversation_id: conversationId,
      },
      defaults: {
        conversation_id: conversationId,
        user1_id: sortedUserIds[0],
        user2_id: sortedUserIds[1],
        last_message_id: messageIdString,
        last_message_text: savedMessage.content,
        last_message_time: savedMessage.createdAt,
        last_message_sender_id: savedMessage.senderId,
      },
    });

    // If conversation already existed, update its metadata
    if (!created) {
      await Conversation.update(
        {
          last_message_id: messageIdString,
          last_message_text: savedMessage.content,
          last_message_time: savedMessage.createdAt,
          last_message_sender_id: savedMessage.senderId,
        },
        {
          where: {
            conversation_id: conversationId,
          },
        }
      );
    }

    // Return the saved message with receiver_id if provided
    const response = {
      ...savedMessage,
      conversationId: conversationId, // Include conversationId (may be auto-generated)
      messageId: messageIdString,
      receiverId: receiverId,
    };

    res.status(201).json({
      message: "Message sent successfully",
      data: response,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      error: "Failed to send message",
      details: error.message,
    });
  }
};
