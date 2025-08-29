import express from "express";
import fs from "fs";
import path from "path";
import { authenticateToken } from "./middleware/auth.js";
import usersRouter from "./controllers/users.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import multer from "multer";
import { extractText, isValidFileType } from "./Extractor/extractor.js";
dotenv.config();

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/resumeoptimizer",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set uploads directory
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// --- User routes ---
app.use("/api/users", usersRouter);

// --- Protected: List resumes ---
app.get("/api/resumes", authenticateToken, async (req, res) => {
  try {
    const resumes = await Resume.find().sort({ uploadDate: -1 });
    res.json(resumes);
  } catch (err) {
    console.error("Error fetching resumes:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Protected: Get single resume ---
app.get("/api/resumes/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);
    if (!resume)
      return res
        .status(404)
        .json({ success: false, error: "Resume not found" });
    res.json({ success: true, resume });
  } catch (err) {
    console.error("Error fetching resume:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Protected: Delete resume ---
app.delete("/api/resumes/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedResume = await Resume.findByIdAndDelete(id);
    if (!deletedResume)
      return res
        .status(404)
        .json({ success: false, error: "Resume not found" });

    if (deletedResume.filePath) {
      const fullFilePath = path.join(process.cwd(), deletedResume.filePath);
      if (fs.existsSync(fullFilePath)) {
        try {
          fs.unlinkSync(fullFilePath);
          console.log(`Deleted file: ${fullFilePath}`);
        } catch (fileDeleteError) {
          console.error("Error deleting file:", fileDeleteError);
        }
      }
    }

    res.json({
      success: true,
      message: "Resume and associated file deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting resume:", err);
    res.status(500).json({ success: false, error: "Failed to delete resume" });
  }
});

// --- Protected: Upload resume ---
app.post(
  "/api/resumes",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file || !isValidFileType(file)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid or missing file" });
      }

      const text = await extractText(file);

      const resume = new Resume({
        user: req.user.id,
        filePath: path.relative(process.cwd(), file.path),
        originalName: file.originalname,
        uploadDate: new Date(),
        extractedText: text,
      });
      await resume.save();

      res.status(201).json({ success: true, resume });
    } catch (err) {
      console.error("Error uploading resume:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Static files
app.use("/uploads", express.static(uploadsDir));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
