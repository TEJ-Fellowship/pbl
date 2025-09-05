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
      x: Number,
      y: Number,
      color: String,
      size: Number,
      tool: { type: String, enum: ["brush", "eraser"], default: "brush" }
    }
  ],
  background: {
    type: String,
    default: ""
  },
  finalImage: {
    type: String,
    default: ""
  },
  caption: {
    type: String,
    default: ""
  },
},{timestamps: true});

export default mongoose.model("Loop", loopSchema);
