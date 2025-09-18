import { Chat } from "../models/Chat.js";
import { Message } from "../models/Message.js";
import { Friend } from "../models/Friend.js";
import { uploadToAzure, deleteFromAzure } from "../utils/azureStorage.js";

// Get or create chat between two users
export const getOrCreateChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;

    // Verify friendship exists
    const friendship = await Friend.findOne({
      $or: [
        { requester: userId, recipient: friendId, status: "accepted" },
        { requester: friendId, recipient: userId, status: "accepted" }
      ]
    });

    if (!friendship) {
      return res.status(403).json({ message: "You can only chat with friends" });
    }

    // Sort participants to ensure consistent chat lookup
    const participants = [userId, friendId].sort();

    let chat = await Chat.findOne({ participants }).populate("participants", "username email profilePic");

    if (!chat) {
      chat = new Chat({ participants });
      await chat.save();
      await chat.populate("participants", "username email profilePic");
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Error getting/creating chat:", error);
    res.status(500).json({ message: "Failed to get chat", error: error.message });
  }
};

// Get user's chats
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({
      participants: userId
    })
    .populate("participants", "username email profilePic")
    .populate("lastMessage")
    .sort({ lastActivity: -1 });

    res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: "Failed to fetch chats", error: error.message });
  }
};

// Send text message
export const sendTextMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { content } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ message: "Not authorized to send messages in this chat" });
    }

    const message = new Message({
      chat: chatId,
      sender: userId,
      messageType: "text",
      content
    });

    await message.save();

    // Update chat's last message and activity
    chat.lastMessage = message._id;
    chat.lastActivity = new Date();
    await chat.save();

    await message.populate("sender", "username email profilePic");

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending text message:", error);
    res.status(500).json({ message: "Failed to send message", error: error.message });
  }
};

// Send voice message
export const sendVoiceMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { duration } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No audio file provided" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ message: "Not authorized to send messages in this chat" });
    }

    // Upload voice message to Azure
    const fileBuffer = req.file.buffer;
    const fileType = req.file.mimetype;
    const uploadResult = await uploadToAzure(fileBuffer, userId, fileType);

    const message = new Message({
      chat: chatId,
      sender: userId,
      messageType: "voice",
      voiceUrl: uploadResult.fileUrl,
      blobName: uploadResult.blobName,
      duration: parseInt(duration) || 0
    });

    await message.save();

    // Update chat's last message and activity
    chat.lastMessage = message._id;
    chat.lastActivity = new Date();
    await chat.save();

    await message.populate("sender", "username email profilePic");

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending voice message:", error);
    res.status(500).json({ message: "Failed to send voice message", error: error.message });
  }
};

// Get chat messages
export const getChatMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ message: "Not authorized to view this chat" });
    }

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "username email profilePic")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.status(200).json(messages.reverse());
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages", error: error.message });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    // Delete voice file from Azure if it's a voice message
    if (message.messageType === "voice" && message.blobName) {
      await deleteFromAzure(message.blobName);
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Failed to delete message", error: error.message });
  }
};