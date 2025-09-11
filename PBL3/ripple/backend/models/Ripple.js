import mongoose from "mongoose";

const responseSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: "User" },
  type: { type: String, enum: ["friends", "global"], required: true },
  timestamp: { type: Date, default: Date.now() },
});

const rippleSchema = new mongoose.Schema({
  rippleId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  message: { type: String },
  visibility: [
    {
      type: String,
      enum: ["friends", "global"],
      default: ["friends"],
    },
  ],
  createdAt: { type: Date, default: Date.now() },
  expiresAt: { type: Date },
  responses: [responseSchema],
});

export default mongoose.model("Ripple", rippleSchema);
