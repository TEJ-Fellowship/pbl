const Resume = require("../models/resume");
const pdfParse = require("pdf-parse");
const fs = require("fs").promises;
const path = require("path");
const { AppError } = require("../utils/appError");
const { validateFile } = require("../utils/fileValidation");

// Upload resume
const uploadResume = async (file) => {
  try {
    // Validate file
    const validationErrors = validateFile(file);
    if (validationErrors.length > 0) {
      throw new AppError(validationErrors.join(", "), 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `resume_${timestamp}.pdf`;
    const uploadDir = path.join(__dirname, "../uploads");
    const filePath = path.join(uploadDir, fileName);

    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Save file
    await fs.writeFile(filePath, file.buffer);

    // Extract text from PDF
    let extractedText;
    try {
      const pdfData = await pdfParse(file.buffer);
      extractedText = pdfData.text;
    } catch (parseError) {
      console.error("PDF parsing error:", parseError);
      throw new AppError(
        "Could not extract text from PDF. Please ensure the PDF contains readable text.",
        400
      );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new AppError(
        "Could not extract text from PDF. Please ensure the PDF contains readable text.",
        400
      );
    }

    // Create resume record
    const resume = await Resume.create({
      originalName: file.originalname,
      fileName,
      filePath,
      fileSize: file.size,
      mimeType: file.mimetype,
      extractedText: extractedText.trim(),
      textLength: extractedText.trim().length,
    });

    return resume;
  } catch (error) {
    // Clean up file if it was saved
    if (file && file.path) {
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        console.error("Error deleting file:", unlinkError);
      }
    }
    throw error;
  }
};

// Get all resumes
const getAllResumes = async () => {
  return Resume.find({}).sort({ uploadDate: -1 });
};

// Get resume by ID
const getResumeById = async (id) => {
  const resume = await Resume.findById(id);

  if (!resume) {
    throw new AppError("Resume not found", 404);
  }

  return resume;
};

// Delete resume
const deleteResume = async (id) => {
  const resume = await Resume.findById(id);

  if (!resume) {
    throw new AppError("Resume not found", 404);
  }

  // Delete file from filesystem
  try {
    await fs.unlink(resume.filePath);
  } catch (error) {
    console.error("Error deleting file:", error);
  }

  // Delete from database
  await Resume.findByIdAndDelete(id);

  return { message: "Resume deleted successfully" };
};

// Update analysis
const updateAnalysis = async (id, analysisResult) => {
  const resume = await Resume.findByIdAndUpdate(
    id,
    {
      isAnalyzed: true,
      analysisResult: {
        ...analysisResult,
        analysisDate: new Date(),
      },
    },
    { new: true }
  );

  if (!resume) {
    throw new AppError("Resume not found", 404);
  }

  return resume;
};

module.exports = {
  uploadResume,
  getAllResumes,
  getResumeById,
  deleteResume,
  updateAnalysis,
};
