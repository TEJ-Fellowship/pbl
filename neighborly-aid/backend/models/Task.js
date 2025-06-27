const mongoose = require("mongoose");
const {
  OPEN,
  CLAIMED,
  COMPLETED,
  LOW,
  MEDIUM,
  HIGH,
} = require("../utils/constants");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 1000,
  },
  category: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100,
  },
  urgency: { type: String, enum: [LOW, MEDIUM, HIGH] },
  status: {
    type: String,
    enum: [OPEN, CLAIMED, COMPLETED],
    default: OPEN,
  },
  location: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100,
  },
  taskKarmaPoints: { type: Number, default: 10 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  likes: { type: Number, default: 0 },
  helpers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
});

module.exports = mongoose.model("Task", taskSchema);
