import mongoose from "mongoose";

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
  sentiment: { type: String },
  createdAt: { type: Date, default: Date.now() },
  expiresAt: { type: Date },
});

export default mongoose.model("Ripple", rippleSchema);
