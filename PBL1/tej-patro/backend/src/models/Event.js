/*
Note:

This file:
-Defines the structure of an event document in MongoDB.
-Enforces required fields like title, start, end, and userId.
-Associates each event with a specific user via userId.
-Automatically adds createdAt and updatedAt timestamps.
-Improves query performance with an index on userId and start.
*/ 

const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      default: "",
    },
    isAllDay: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: "#2196F3",
    },
    userId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ userId: 1, start: 1 });

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;