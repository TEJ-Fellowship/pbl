const mongoose = require("mongoose");
const {
  OPEN,
  IN_PROGRESS,
  COMPLETED,
  LOW,
  MEDIUM,
  HIGH,
  ACTIVE,
  HELPER_COMPLETED,
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

  location: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100,
  },
  taskKarmaPoints: { type: Number, default: 10 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  likes: { type: Number, default: 0 },
  likedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  urgency: { type: String, enum: [LOW, MEDIUM, HIGH] },
  status: {
    type: String,
    enum: [OPEN, IN_PROGRESS, COMPLETED],
    default: OPEN,
  },
  helpers: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      acceptedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: [ACTIVE, HELPER_COMPLETED],
        default: ACTIVE,
      },
    },
  ],

  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
});

module.exports = mongoose.model("Task", taskSchema);
