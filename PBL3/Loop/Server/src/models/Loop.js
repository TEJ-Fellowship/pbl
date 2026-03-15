// models/Loop.js
import mongoose from "mongoose";

const loopSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  strokes: [
    {
      tool: {
        type: String,
        enum: ["pen", "eraser"],
        required: true
      },
      color: {
        type: String,
        required: true
      },
      size: {
        type: Number,
        required: true
      },
      points: [{
        x: { type: Number, required: true },
        y: { type: Number, required: true }
      }],
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    }
  ],
  finalImage: {
    type: String,
    required: true // Base64 encoded image data
  },
  caption: {
    type: String,
    default: ""
  },
  metadata: {
    canvasWidth: Number,
    canvasHeight: Number,
    totalStrokes: Number
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
loopSchema.index({ room: 1, createdAt: -1 });
loopSchema.index({ creator: 1, createdAt: -1 });

export default mongoose.model("Loop", loopSchema);