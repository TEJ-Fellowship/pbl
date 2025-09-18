import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  messageType: {
    type: String,
    enum: ["text", "voice"],
    required: true,
  },
  content: {
    type: String,
    required: function() {
      return this.messageType === "text";
    },
  },
  voiceUrl: {
    type: String,
    required: function() {
      return this.messageType === "voice";
    },
  },
  blobName: {
    type: String,
    required: function() {
      return this.messageType === "voice";
    },
  },
  duration: {
    type: Number,
    required: function() {
      return this.messageType === "voice";
    },
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Message = mongoose.model("Message", messageSchema);