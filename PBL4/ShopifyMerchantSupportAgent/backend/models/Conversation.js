import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      default: "anonymous",
    },
    title: {
      type: String,
      default: "New Conversation",
    },
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Update the updatedAt field before saving
conversationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Method to get recent messages (last 8 messages for sliding window)
conversationSchema.methods.getRecentMessages = function (limit = 8) {
  return this.messages.slice(-limit);
};

// Method to add a message to the conversation
conversationSchema.methods.addMessage = function (messageId) {
  this.messages.push(messageId);
  this.updatedAt = new Date();
  return this.save();
};

export default mongoose.model("Conversation", conversationSchema);
