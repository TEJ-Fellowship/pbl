import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
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
    conversationState: {
      turnCount: {
        type: Number,
        default: 0,
      },
      lastCompressionTurn: {
        type: Number,
        default: 0,
      },
      contextSummary: {
        type: String,
        default: null,
      },
      userPreferences: {
        preferredAPI: {
          type: String,
          default: null,
        },
        technicalLevel: {
          type: String,
          default: "intermediate",
        },
        topics: [String],
        merchantPlanTier: {
          type: String,
          default: null,
        },
        storeType: {
          type: String,
          default: null,
        },
        industry: {
          type: String,
          default: null,
        },
        location: {
          type: String,
          default: null,
        },
        preferredLanguage: {
          type: String,
          default: "en",
        },
        timezone: {
          type: String,
          default: null,
        },
        storeSize: {
          type: String,
          default: null,
        },
        experienceLevel: {
          type: String,
          default: null,
        },
        goals: [String],
      },
      conversationFlow: {
        currentTopic: {
          type: String,
          default: null,
        },
        previousTopics: [String],
        followUpContext: {
          type: String,
          default: null,
        },
      },
      ambiguityFlags: {
        needsClarification: {
          type: Boolean,
          default: false,
        },
        clarificationQuestion: {
          type: String,
          default: null,
        },
        pendingClarification: {
          type: String,
          default: null,
        },
      },
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

// Strategic indexes for performance optimization (Bottleneck #8)
// Note: sessionId already has a unique index from unique: true constraint
// History queries index
conversationSchema.index({ updatedAt: -1, isActive: 1 }); // For history queries
// Composite index for session lookups with sorting
conversationSchema.index({ sessionId: 1, updatedAt: -1 }); // Composite for session lookups

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
