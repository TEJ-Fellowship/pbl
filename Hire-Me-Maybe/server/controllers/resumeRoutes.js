const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Resume = require("../models/resume");
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

// Middleware to handle multer errors
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size too large. Maximum size is 5MB.",
      });
    }
  } else if (error.message === "Only PDF files are allowed") {
    return res.status(400).json({
      success: false,
      message: "Only PDF files are allowed",
    });
  }
  next(error);
};

// Upload resume
router.post(
  "/resumes/upload",
  upload.single("resume"),
  handleMulterError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // For now, use a mock userId. In production, get from authentication
      const userId = req.body.userId || "507f1f77bcf86cd799439011";

      const resume = new Resume({
        userId: userId,
        originalName: req.file.originalname,
        filename: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
      });

      await resume.save();

      console.log("Resume uploaded:", resume);

      res.status(200).json({
        success: true,
        message: "Resume uploaded successfully",
        data: {
          id: resume._id,
          originalName: resume.originalName,
          filename: resume.filename,
          fileSize: resume.fileSize,
          uploadDate: resume.uploadDate,
          isAnalyzed: resume.isAnalyzed,
          wordCount: resume.wordCount,
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        success: false,
        message: "Upload failed",
        error: error.message,
      });
    }
  }
);

// Get all resumes for a user
router.get("/resumes", async (req, res) => {
  try {
    // For now, use a mock userId. In production, get from authentication
    const userId = req.query.userId || "507f1f77bcf86cd799439011";

    const resumes = await Resume.find({
      userId: userId,
      status: { $ne: "deleted" },
    }).sort({ uploadDate: -1 });

    res.status(200).json({
      success: true,
      data: resumes,
    });
  } catch (error) {
    console.error("Fetch resumes error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch resumes",
      error: error.message,
    });
  }
});

// Get specific resume
router.get("/resumes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    res.status(200).json({
      success: true,
      data: resume,
    });
  } catch (error) {
    console.error("Fetch resume error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch resume",
      error: error.message,
    });
  }
});

// Analyze resume
router.post("/resumes/:id/analyze", async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    // Mock analysis result - replace with actual AI analysis
    const analysisResult = {
      skills: ["JavaScript", "React", "Node.js", "MongoDB", "Express"],
      experience: "3-5 years",
      education: "Bachelor's degree",
      strengths: ["Strong technical skills", "Good communication"],
      weaknesses: ["Could improve leadership experience"],
      suggestions: [
        "Add more quantifiable achievements",
        "Include specific project examples",
        "Highlight leadership experience",
      ],
      wordCount: 450,
      score: 85,
    };

    resume.isAnalyzed = true;
    resume.analysisResult = analysisResult;
    resume.wordCount = analysisResult.wordCount;
    await resume.save();

    res.status(200).json({
      success: true,
      message: "Resume analyzed successfully",
      data: analysisResult,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({
      success: false,
      message: "Analysis failed",
      error: error.message,
    });
  }
});

// Customize resume for specific job
router.post("/resumes/:id/customize", async (req, res) => {
  try {
    const { id } = req.params;
    const { jobDetails, versionName } = req.body;

    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    // Mock customization - replace with actual AI customization
    const customizedContent = `
# ${jobDetails.jobTitle} Resume

## Professional Summary
Experienced ${jobDetails.jobTitle} with expertise in ${
      jobDetails.industry || "technology"
    } industry. 
Skilled in ${
      jobDetails.requirements || "software development"
    } with a proven track record of delivering high-quality solutions.

## Skills
- ${jobDetails.requirements || "JavaScript, React, Node.js"}
- Problem-solving and analytical thinking
- Team collaboration and communication
- Project management and leadership

## Experience
### Senior Developer at Tech Company
- Led development of multiple web applications
- Managed team of 5 developers
- Improved application performance by 40%

## Education
Bachelor's Degree in Computer Science
University of Technology

## Customized for: ${jobDetails.company}
Position: ${jobDetails.jobTitle}
Industry: ${jobDetails.industry || "Technology"}
Location: ${jobDetails.location || "Remote"}
    `;

    const newVersion = {
      versionName: versionName || `Customized for ${jobDetails.company}`,
      jobDetails: jobDetails,
      customizedContent: customizedContent,
      createdAt: new Date(),
      isActive: true,
    };

    resume.versions.push(newVersion);
    await resume.save();

    res.status(200).json({
      success: true,
      message: "Resume customized successfully",
      data: {
        version: newVersion,
        resumeId: resume._id,
      },
    });
  } catch (error) {
    console.error("Customization error:", error);
    res.status(500).json({
      success: false,
      message: "Customization failed",
      error: error.message,
    });
  }
});

// Get resume versions
router.get("/resumes/:id/versions", async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    res.status(200).json({
      success: true,
      data: resume.versions,
    });
  } catch (error) {
    console.error("Fetch versions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch versions",
      error: error.message,
    });
  }
});

// Delete resume
router.delete("/resumes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    // Soft delete - mark as deleted
    resume.status = "deleted";
    await resume.save();

    // Optionally delete the actual file
    if (fs.existsSync(resume.filePath)) {
      fs.unlinkSync(resume.filePath);
    }

    res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete resume",
      error: error.message,
    });
  }
});

module.exports = router;
