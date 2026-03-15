import mongoose from "mongoose";

const globalRippleSchema = new mongoose.Schema({
  rippleId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now() },
  expiresAt: { type: Date },
});

export default mongoose.model("GlobalRipple", globalRippleSchema);
