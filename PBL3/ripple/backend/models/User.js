import mongoose from "mongoose";

const streakSchema = new mongoose.Schema({
  current: { type: Number, default: 0 },
  longest: { type: Number, default: 0 },
  lastActivity: { type: Date, default: Date.now }, // Track last activity for streak calculation
});

const rippleStatsSchema = new mongoose.Schema({
  sent: { type: Number, default: 0 },
  received: { type: Number, default: 0 },
  wavesStarted: { type: Number, default: 0 },
  totalRipplebacks: { type: Number, default: 0 },
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: { type: String, required: true },
  streak: { type: streakSchema, default: () => ({}) },
  rippleStats: { type: rippleStatsSchema, default: () => ({}) },
  badges: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);