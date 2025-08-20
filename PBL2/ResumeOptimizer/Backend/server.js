import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection (clean, no deprecated options)
mongoose.connect("mongodb://127.0.0.1:27017/resumes");

// Schema & Model
const resumeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  notes: String,
  uploadDate: { type: Date, default: Date.now },
  filePath: String,
});
const Resume = mongoose.model("Resume", resumeSchema);

// File storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// POST route: Save resume
app.post("/api/resumes", upload.single("file"), async (req, res) => {
  try {
    const { title, notes } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ success: false, error: "Title is required!" });
    }

    const newResume = new Resume({
      title,
      notes,
      uploadDate: new Date(),
      filePath: req.file ? req.file.path : null,
    });

    await newResume.save();
    res.json({ success: true, resume: newResume });
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

app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));
