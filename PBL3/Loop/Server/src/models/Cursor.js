// models/Cursor.js
import mongoose from "mongoose";

const cursorSchema = new mongoose.Schema({
  userId: String,
  x: Number,
  y: Number,
  color: String,
});

export default mongoose.model("Cursor", cursorSchema);
