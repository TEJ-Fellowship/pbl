import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  // Basic feedback information
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    required: true,
  },
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },

  // User feedback
  feedback: {
    type: String,
    enum: ["positive", "negative", "neutral"],
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: false,
  },
  comment: {
    type: String,
    maxlength: 1000,
    required: false,
  },

  // Context information
  query: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  intent: {
    type: String,
    required: true,
  },
  confidence: {
    score: {
      type: Number,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    factors: [{
      type: String,
    }],
  },

  // Source information
  sources: [{
    title: String,
    url: String,
    category: String,
    score: Number,
    searchType: String,
  }],

  // MCP tools used
  mcpTools: {
    toolsUsed: [String],
    toolResults: mongoose.Schema.Types.Mixed,
  },

  // Merchant information
  merchantInfo: {
    planTier: String,
    storeType: String,
    industry: String,
    experienceLevel: String,
    location: String,
  },

  // Processing information
  processingTime: {
    type: Number,
    required: true,
  },
  modelUsed: {
    type: String,
    required: true,
  },

  // Feedback analysis
  feedbackAnalysis: {
    isHelpful: {
      type: Boolean,
      default: null,
    },
    isAccurate: {
      type: Boolean,
      default: null,
    },
    isComplete: {
      type: Boolean,
      default: null,
    },
    needsImprovement: {
      type: Boolean,
      default: null,
    },
    improvementSuggestions: [String],
  },

  // Auto-retrain flags
  retrainFlags: {
    needsRetrain: {
      type: Boolean,
      default: false,
    },
    retrainReason: {
      type: String,
      enum: ["low_confidence", "negative_feedback", "source_quality", "intent_mismatch"],
    },
    retrainPriority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient querying
feedbackSchema.index({ sessionId: 1, createdAt: -1 });
feedbackSchema.index({ feedback: 1, createdAt: -1 });
feedbackSchema.index({ intent: 1, createdAt: -1 });
feedbackSchema.index({ "retrainFlags.needsRetrain": 1, "retrainFlags.retrainPriority": 1 });
feedbackSchema.index({ "merchantInfo.planTier": 1, createdAt: -1 });

// Pre-save middleware to update timestamps
feedbackSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get feedback statistics
feedbackSchema.statics.getFeedbackStats = async function (filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        positive: { $sum: { $cond: [{ $eq: ["$feedback", "positive"] }, 1, 0] } },
        negative: { $sum: { $cond: [{ $eq: ["$feedback", "negative"] }, 1, 0] } },
        neutral: { $sum: { $cond: [{ $eq: ["$feedback", "neutral"] }, 1, 0] } },
        avgRating: { $avg: "$rating" },
        avgConfidence: { $avg: "$confidence.score" },
        needsRetrain: { $sum: { $cond: [{ $eq: ["$retrainFlags.needsRetrain", true] }, 1, 0] } },
      },
    },
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    total: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    avgRating: 0,
    avgConfidence: 0,
    needsRetrain: 0,
  };
};

// Static method to get feedback by intent
feedbackSchema.statics.getFeedbackByIntent = async function (intent, limit = 100) {
  return this.find({ intent })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("messageId", "content metadata")
    .populate("conversationId", "sessionId");
};

// Static method to get feedback requiring retraining
feedbackSchema.statics.getRetrainCandidates = async function (priority = "medium") {
  return this.find({
    "retrainFlags.needsRetrain": true,
    "retrainFlags.retrainPriority": { $gte: priority },
  })
    .sort({ "retrainFlags.retrainPriority": 1, createdAt: -1 })
    .limit(50);
};

// Instance method to analyze feedback
feedbackSchema.methods.analyzeFeedback = function () {
  const analysis = {
    isHelpful: null,
    isAccurate: null,
    isComplete: null,
    needsImprovement: false,
    improvementSuggestions: [],
  };

  // Analyze based on feedback type
  if (this.feedback === "positive") {
    analysis.isHelpful = true;
    analysis.isAccurate = true;
    analysis.isComplete = true;
  } else if (this.feedback === "negative") {
    analysis.isHelpful = false;
    analysis.needsImprovement = true;
    
    // Analyze based on comment
    if (this.comment) {
      const commentLower = this.comment.toLowerCase();
      
      if (commentLower.includes("wrong") || commentLower.includes("incorrect")) {
        analysis.isAccurate = false;
        analysis.improvementSuggestions.push("Improve answer accuracy");
      }
      
      if (commentLower.includes("incomplete") || commentLower.includes("missing")) {
        analysis.isComplete = false;
        analysis.improvementSuggestions.push("Provide more comprehensive answers");
      }
      
      if (commentLower.includes("confusing") || commentLower.includes("unclear")) {
        analysis.improvementSuggestions.push("Improve answer clarity");
      }
      
      if (commentLower.includes("irrelevant") || commentLower.includes("not helpful")) {
        analysis.isHelpful = false;
        analysis.improvementSuggestions.push("Improve answer relevance");
      }
    }
  }

  // Analyze based on confidence score
  if (this.confidence.score < 50) {
    analysis.needsImprovement = true;
    analysis.improvementSuggestions.push("Improve confidence scoring");
  }

  // Analyze based on sources
  if (this.sources.length < 2) {
    analysis.needsImprovement = true;
    analysis.improvementSuggestions.push("Provide more diverse sources");
  }

  this.feedbackAnalysis = analysis;
  return analysis;
};

// Instance method to determine retrain flags
feedbackSchema.methods.determineRetrainFlags = function () {
  const flags = {
    needsRetrain: false,
    retrainReason: null,
    retrainPriority: "low",
  };

  // Check for negative feedback
  if (this.feedback === "negative") {
    flags.needsRetrain = true;
    flags.retrainReason = "negative_feedback";
    flags.retrainPriority = "high";
  }

  // Check for low confidence
  if (this.confidence.score < 40) {
    flags.needsRetrain = true;
    flags.retrainReason = "low_confidence";
    flags.retrainPriority = "medium";
  }

  // Check for source quality issues
  const lowQualitySources = this.sources.filter(s => s.score < 0.3);
  if (lowQualitySources.length > this.sources.length / 2) {
    flags.needsRetrain = true;
    flags.retrainReason = "source_quality";
    flags.retrainPriority = "medium";
  }

  // Check for intent mismatch
  if (this.feedbackAnalysis && this.feedbackAnalysis.needsImprovement) {
    flags.needsRetrain = true;
    flags.retrainReason = "intent_mismatch";
    flags.retrainPriority = "high";
  }

  this.retrainFlags = flags;
  return flags;
};

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;
