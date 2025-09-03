import mongoose, { Mongoose } from "mongoose";

const streakSchema = new mongoose.Schema({
  current: { type: Number, default: 0 },
  longest: { type: Number, default: 0 },
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
  badges: [{ type: String }],
  createdAt: { type: Date, default: Date.now() },
});

export default mongoose.model("User", userSchema);
