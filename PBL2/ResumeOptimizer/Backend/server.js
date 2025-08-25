import express from "express";
import mongoose from "mongoose";
import os from "os";
import multer from "multer";
import cors from "cors";
import path from "path";
import  {extractText}  from "./Extractor/extractor.js"; 

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://ashok:password98765@cluster0.3prgcdv.mongodb.net/CvDetails?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Database successfully connected'))
  .catch((error) => console.log('Error connecting database', error.message));

// Schema & Model
const resumeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  notes: String,
  uploadDate: { type: Date, default: Date.now },
  filePath: String,
  rawText: String, // new field for extracted text
});
const Resume = mongoose.model("Resume", resumeSchema);

// File storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage }); // Use disk storage, not memoryStorage

// POST route: Save resume
app.post("/api/resumes", upload.single("file"), async (req, res) => {
  try {
    const { title, notes } = req.body;
    if (!title || title.trim() === "") {
      return res.status(400).json({ success: false, error: "Title is required!" });
    }
    let rawText = "";
    if (req.file) {
      rawText = await extractText(req.file); // Pass the file object
    }
    const newResume = new Resume({
      title,
      notes,
      uploadDate: new Date(),
      filePath: null, // Not used with memoryStorage
      rawText,
    });
    await newResume.save();
    res.json({
      success: true,
      resume: newResume,
      extractedTextPreview: rawText.slice(0, 500) + (rawText.length > 500 ? "..." : ""),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET route: Fetch all resumes
app.get("/api/resumes", async (req, res) => {
  const resumes = await Resume.find().sort({ uploadDate: -1 });
  res.json(resumes);
});

// DELETE route: Remove resume by ID
app.delete("/api/resumes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedResume = await Resume.findByIdAndDelete(id);

    if (!deletedResume) {
      return res.status(404).json({ success: false, error: "Resume not found" });
    }

    res.json({ success: true, message: "Resume deleted successfully" });
  } catch (err) {
    console.error("Error deleting resume:", err);
    res.status(500).json({ success: false, error: "Failed to delete resume" });
  }
});

app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));

console.log("Hello")