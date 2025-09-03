import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import Resume from "../models/Resume.js";
import { authenticateToken } from "../middleware/auth.js";
import { extractText, isValidFileType } from "../Extractor/extractor.js";

const router = express.Router();

// --- Multer setup ---
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// -------------------------------
// POST /api/resumes/upload
// Upload resume and extract text
// -------------------------------
router.post("/upload", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { title, notes } = req.body;

    if (!file) return res.status(400).json({ error: "No file uploaded" });
    if (!title) return res.status(400).json({ error: "Title is required" });
    if (!isValidFileType(file)) return res.status(400).json({ error: "Unsupported file type" });

    const extractedText = await extractText(file);

    const resume = new Resume({
      user: req.user.id,
      title,                     // Save title
      notes,                     // Save notes (optional)
      originalName: file.originalname,
      filePath: path.relative(process.cwd(), file.path),
      fileType: path.extname(file.originalname).slice(1).toLowerCase(),
      extractedText,
      status: "Processed successfully",
      uploadDate: new Date(),    // Track upload date
    });

    await resume.save();
    res.status(201).json({ success: true, message: "Resume uploaded and processed", resume });
  } catch (err) {
    console.error("Resume upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------
// GET /api/resumes/my
// Get all resumes of the logged-in user
// -------------------------------
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id }).sort({ uploadDate: -1 });
    res.json(resumes);
  } catch (err) {
    console.error("Fetch resumes error:", err);
    res.status(500).json({ error: "Error fetching resumes" });
  }
});

// -------------------------------
// GET /api/resumes/:id
// Get single resume by ID
// -------------------------------
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ error: "Resume not found" });
    res.json(resume);
  } catch (err) {
    console.error("Fetch resume error:", err);
    res.status(500).json({ error: "Error fetching resume" });
  }
});

// -------------------------------
// DELETE /api/resumes/:id
// Delete resume by ID
// -------------------------------
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const deletedResume = await Resume.findByIdAndDelete(req.params.id);
    if (!deletedResume) return res.status(404).json({ error: "Resume not found" });

    // Delete file from uploads
    const fullPath = path.join(process.cwd(), deletedResume.filePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

    res.json({ success: true, message: "Resume deleted successfully" });
  } catch (err) {
    console.error("Delete resume error:", err);
    res.status(500).json({ error: "Error deleting resume" });
  }
});

export default router;
