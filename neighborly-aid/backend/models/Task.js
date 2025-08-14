const mongoose = require("mongoose");
const {
  OPEN,
  IN_PROGRESS,
  COMPLETED,
  LOW,
  MEDIUM,
  HIGH,
  PENDING,
  ACTIVE,
  SELECTED,
  REJECTED,
  HELPER_COMPLETED,
  AWAITING_APPROVAL,
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
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    minlength: 3,
    maxlength: 100,
  },
  // Keep the old category field temporarily for migration
  categoryName: {
    type: String,
    required: false,
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
    enum: [OPEN, IN_PROGRESS, AWAITING_APPROVAL, COMPLETED],
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
        enum: [PENDING, ACTIVE, SELECTED, REJECTED, HELPER_COMPLETED],
        default: PENDING,
      },
      selectedAt: Date,
    },
  ],
  selectedHelper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
  helperMarkedComplete: {
    type: Boolean,
    default: false,
  },
  helperCompletedAt: Date,
  requesterApproved: {
    type: Boolean,
    default: null,
  },
  requesterApprovedAt: Date,
  completionNotes: {
    type: String,
    maxlength: 500,
  },
});

module.exports = mongoose.model("Task", taskSchema);
