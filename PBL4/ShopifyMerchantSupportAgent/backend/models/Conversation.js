import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  messages: [
    {
      role: {
        type: String,
        enum: ["user", "assistant"],
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      sources: [
        {
          title: String,
          url: String,
          score: Number,
          chunk: String,
        },
      ],
      feedback: {
        helpful: Boolean,
        timestamp: Date,
      },
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
});

// Update the updatedAt field before saving
conversationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient querying
conversationSchema.index({ sessionId: 1, "messages.timestamp": -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
