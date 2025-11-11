import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  votes: {
    type: Number,
    default: 0,
  },
});

const pollSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [optionSchema],
    validate: v => v.length >= 2,
  },
  timer: {
    type: String,
    enum: ["no-timer", "5m", "15m", "30m", "1h", "24h"],
    default: "no-timer",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
  },
   user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
});

const Poll = mongoose.models.Poll || mongoose.model("Poll", pollSchema);
export default Poll

