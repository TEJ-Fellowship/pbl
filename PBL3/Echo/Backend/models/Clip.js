const mongoose = require("mongoose");
const clipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  duration: { type: Number },
  size: { type: Number },

  // AI / processing fields (filled asynchronously by a worker)
  transcript: { type: String, default: "" },
  sentiment: {
    type: String,
    enum: ["positive", "neutral", "negative", "unknown"],
    default: "unknown",
  },
  tags: [{ type: String }], // auto-categories / themes

  reactions: {
    heart: { type: Number, default: 0 },
    laugh: { type: Number, default: 0 },
    sad: { type: Number, default: 0 },
  },

  processingStatus: {
    type: String,
    enum: ["pending", "processing", "done", "failed"],
    default: "pending",
  },

  // moderation/reporting
  reportCount: { type: Number, default: 0 },
  isHidden: { type: Boolean, default: false }, // soft-hide if flagged

  createdAt: { type: Date, default: Date.now },
});

clipSchema.index({ createdAt: -1 });
clipSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Clip", clipSchema);
