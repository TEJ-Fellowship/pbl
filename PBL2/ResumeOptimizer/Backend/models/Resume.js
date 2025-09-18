import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },          // ✅ add title
  notes: { type: String },                          // ✅ add notes
  filePath: { type: String, required: true },
  originalName: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  extractedText: { type: String, required: true },
});

export default mongoose.model("Resume", ResumeSchema);
