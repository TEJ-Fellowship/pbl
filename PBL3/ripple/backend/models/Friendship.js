import mongoose from "mongoose";

const FriendshipSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receipent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "success", "declined", "blocked"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now() },
});

export default mongoose.model("Friendship", FriendshipSchema);
