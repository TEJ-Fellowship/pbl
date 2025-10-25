import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: function () {
        return this.role !== "analytics";
      },
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["user", "assistant", "analytics"],
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      searchResults: [
        {
          title: String,
          source_url: String,
          category: String,
          score: Number,
          searchType: String,
        },
      ],
      modelUsed: String,
      processingTime: Number,
      tokensUsed: Number,
      // New fields for API clarification
      isClarifyingQuestion: Boolean,
      suggestedApis: [String],
      originalQuery: String,
      detectedApi: String,
      mcpTools: {
        toolsUsed: [String],
        toolResults: Object,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
messageSchema.index({ conversationId: 1, timestamp: -1 });

// Method to get formatted message for context
messageSchema.methods.getFormattedMessage = function () {
  return {
    role: this.role,
    content: this.content,
    timestamp: this.timestamp,
  };
};

export default mongoose.model("Message", messageSchema);
