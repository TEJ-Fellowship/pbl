import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    language: { type: String, default: "en" },
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
