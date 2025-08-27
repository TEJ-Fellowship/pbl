import express from "express";
import mongoose from "mongoose";
import os from "os";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";
import { extractText, isValidFileType } from "./Extractor/extractor.js";

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
  filePath: String, // Will store the local file path
  rawText: String, // Extracted text from PDF/DOCX
});
const Resume = mongoose.model("Resume", resumeSchema);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File storage config - Updated to save in uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Save in uploads folder instead of temp
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// Add file filter for validation
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (isValidFileType(file)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'), false);
    }
  }
});

// POST route: Save resume - Updated to handle file path and text extraction
app.post("/api/resumes", upload.single("file"), async (req, res) => {
  try {
    const { title, notes } = req.body;
    
    if (!title || title.trim() === "") {
      return res.status(400).json({ success: false, error: "Title is required!" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: "File is required!" });
    }

    let rawText = "";
    let filePath = null;

    try {
      // Extract text from the uploaded file
      rawText = await extractText(req.file);
      
      // Store the relative file path
      filePath = `uploads/${req.file.filename}`;
      
      console.log(`File saved at: ${filePath}`);
      console.log(`Extracted text length: ${rawText.length} characters`);
      
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError);
      // Still save the file info even if extraction fails
      filePath = `uploads/${req.file.filename}`;
      rawText = `[Text extraction failed: ${extractionError.message}]`;
    }

    const newResume = new Resume({
      title,
      notes: notes || "",
      uploadDate: new Date(),
      filePath, // Now properly stores the file path
      rawText,  // Contains extracted text
    });

    await newResume.save();

    res.json({
      success: true,
      resume: {
        _id: newResume._id,
        title: newResume.title,
        notes: newResume.notes,
        uploadDate: newResume.uploadDate,
        filePath: newResume.filePath,
        textLength: rawText.length
      },
      extractedTextPreview: rawText.slice(0, 500) + (rawText.length > 500 ? "..." : ""),
    });

  } catch (err) {
    console.error('Upload error:', err);
    
    // Clean up uploaded file if there's an error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET route: Fetch all resumes
app.get("/api/resumes", async (req, res) => {
  try {
    const resumes = await Resume.find().sort({ uploadDate: -1 });
    res.json(resumes);
  } catch (err) {
    console.error('Error fetching resumes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET route: Fetch single resume with full text
app.get("/api/resumes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);
    
    if (!resume) {
      return res.status(404).json({ success: false, error: "Resume not found" });
    }
    
    res.json({ success: true, resume });
  } catch (err) {
    console.error('Error fetching resume:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE route: Remove resume by ID - Updated to also delete the file
app.delete("/api/resumes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedResume = await Resume.findByIdAndDelete(id);
    
    if (!deletedResume) {
      return res.status(404).json({ success: false, error: "Resume not found" });
    }

    // Delete the associated file if it exists
    if (deletedResume.filePath) {
      const fullFilePath = path.join(process.cwd(), deletedResume.filePath);
      if (fs.existsSync(fullFilePath)) {
        try {
          fs.unlinkSync(fullFilePath);
          console.log(`Deleted file: ${fullFilePath}`);
        } catch (fileDeleteError) {
          console.error('Error deleting file:', fileDeleteError);
        }
      }
    }
    
    res.json({ success: true, message: "Resume and associated file deleted successfully" });
  } catch (err) {
    console.error("Error deleting resume:", err);
    res.status(500).json({ success: false, error: "Failed to delete resume" });
  }
});

app.use('/uploads', express.static(uploadsDir));

app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));

console.log("Hello");