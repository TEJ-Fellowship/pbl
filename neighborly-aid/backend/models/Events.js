const mongoose = require("mongoose");
const {
  PENDING,
  ACCEPTED,
  DECLINED,
  UPCOMING,
  ONGOING,
  CLOSED,
  CANCELLED,
} = require("../utils/constants");

const eventSchema = new mongoose.Schema({
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
  location: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participants: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      status: {
        type: String,
        enum: [PENDING, ACCEPTED, DECLINED],
        default: PENDING,
      },
    },
  ],
  category: {
    type: String,
    required: true,
  },
  maxParticipants: {
    type: Number,
    min: 1,
  },
  status: {
    type: String,
    enum: [UPCOMING, ONGOING, CLOSED, CANCELLED],
    default: UPCOMING,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Event", eventSchema);
