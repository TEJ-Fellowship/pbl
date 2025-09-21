import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: "User", default: null },
  fromUserId: { type: mongoose.Types.ObjectId, ref: "User" },
  fromUsername: { type: String },
  rippleId: { type: String },
  type: {
    type: String,
    enum: ["friend_ripple", "global_ripple"],
    required: true,
  },
  message: { type: String },
  createdAt: { type: Date },
});

notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
