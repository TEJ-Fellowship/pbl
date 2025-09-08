// models/GroupTimeline.js required in tier 4 - optional

import mongoose from "mongoose";

const groupTimelineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  clips: [{ type: mongoose.Schema.Types.ObjectId, ref: "Clip" }],
  timeCapsuleDate: { type: Date }, // unlock in future
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("GroupTimeline", groupTimelineSchema);
