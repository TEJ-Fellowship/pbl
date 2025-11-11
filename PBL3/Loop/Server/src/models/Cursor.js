// models/Cursor.js
import mongoose from "mongoose";

const cursorSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true
  },
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    default: "#000000"
  },
  username: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
cursorSchema.index({ userId: 1, roomId: 1 });

// TTL index to automatically remove old cursor positions after 30 seconds of inactivity
cursorSchema.index({ lastUpdated: 1 }, { expireAfterSeconds: 30 });

export default mongoose.model("Cursor", cursorSchema);