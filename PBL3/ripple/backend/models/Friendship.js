import mongoose from "mongoose";

const ContactSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now() },
});

ContactSchema.index({ owner: 1, contact: 1 }, { unique: true });

export default mongoose.model("Friendship", ContactSchema);
