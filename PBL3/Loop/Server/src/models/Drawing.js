// Fixed models/Drawing.js with shape support
import mongoose from "mongoose";

const drawingSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true
  },
  tool: {
    type: String,
    enum: ["pen", "eraser", "circle", "square", "rectangle", "triangle", "hexagon", "star"],
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
  // Shape-specific properties
  startX: { type: Number },
  startY: { type: Number },
  endX: { type: Number },
  endY: { type: Number },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { 
  timestamps: true 
});

// Index for efficient queries by room
drawingSchema.index({ roomId: 1, createdAt: 1 });

export default mongoose.model("Drawing", drawingSchema);