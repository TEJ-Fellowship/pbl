// routes/resumeRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import { extractTextFromPDF } from "../extractor.js";
import Resume from "../models/Resume.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// 📂 Configure Multer (file uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // ensure 'uploads' folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// @route POST /api/resumes/upload
// @desc Upload and extract text from resume (protected route)
router.post("/upload", authenticateToken, upload.single("resume"), async (req, res) => {
  try {
    const extractedText = await extractTextFromPDF(req.file.path);

    const resume = new Resume({
      fileName: req.file.originalname,
      filePath: req.file.path,
      extractedText,
      user: req.user.id, // from JWT
    });

    await resume.save();
    res.json({ message: "Resume uploaded & processed successfully", resume });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error processing resume" });
  }
});

// @route GET /api/resumes/my
// @desc Fetch all resumes uploaded by logged-in user
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(resumes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching resumes" });
  }
});

export default router;
