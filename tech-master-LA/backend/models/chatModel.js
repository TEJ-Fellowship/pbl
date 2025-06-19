const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "model", "function", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  // Add a display role for frontend consistency
  displayRole: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  messages: [messageSchema],
  topic: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Conversation", conversationSchema);
