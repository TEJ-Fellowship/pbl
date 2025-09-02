import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  fromUserId: { type: mongoose.Types.ObjectId, ref: "User" },
  rippleId: { type: String },
  type: {
    type: String,
    enum: ["friend_ripple", "global_ripple"],
    required: true,
  },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now() },
  read: { type: Boolean, default: false },
});
