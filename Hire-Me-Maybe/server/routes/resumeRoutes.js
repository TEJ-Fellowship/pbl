const express = require("express");
const multer = require("multer");
const {
  uploadResume,
  getAllResumes,
  getResumeById,
  deleteResume,
} = require("../controllers/resumeController");

const resumeRouter = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    // 5MB limit
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

// Resume routes
resumeRouter.post("/upload", upload.single("resume"), uploadResume);
resumeRouter.get("/", getAllResumes);
resumeRouter.get("/:id", getResumeById);
resumeRouter.delete("/:id", deleteResume);

module.exports = resumeRouter;
