// models/Drawing.js
import mongoose from "mongoose";

const drawingSchema = new mongoose.Schema({
  tool: String,
  color: String,
  size: Number,
  start: { x: Number, y: Number },
  end: { x: Number, y: Number },
  dell
});

export default mongoose.model("Drawing", drawingSchema);
