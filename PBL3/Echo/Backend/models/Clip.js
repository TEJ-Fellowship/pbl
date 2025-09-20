//models/Clip
const mongoose = require("mongoose");
const reactionSchema = require("./Reaction");

const clipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  duration: { type: Number },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },
  size: { type: Number },
  transcript: { type: String, default: "" },
  sentiment: {
    type: String,
    enum: ["positive", "neutral", "negative", "unknown"],
    default: "unknown",
  },
  tags: [{ type: String }],
  reactions: [reactionSchema], // 👈 using the modular schema
  processingStatus: {
    type: String,
    enum: ["pending", "processing", "done", "failed"],
    default: "pending",
  },
  reportCount: { type: Number, default: 0 },
  isHidden: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

clipSchema.index({ createdAt: -1 });
clipSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Clip", clipSchema);
