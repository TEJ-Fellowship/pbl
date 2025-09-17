import mongoose from "mongoose";

const voiceNoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: { type: String, required: true, trim: true },
  tags: { type: [String], default: [] },

  fileUrl: { type: String, required: true },
  blobName: { type: String, required: true },
  fileType: { type: String },
  fileSize: { type: Number }, 
  duration: { type: Number },

  visibility: {
    type: String,
    enum: ["private", "public"],
    default: "private",
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const VoiceNote = mongoose.model("VoiceNote", voiceNoteSchema);
