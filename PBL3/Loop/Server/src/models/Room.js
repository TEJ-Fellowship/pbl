// models/Room.js
import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // NEW
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Room", roomSchema);
