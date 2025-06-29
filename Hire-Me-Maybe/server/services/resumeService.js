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

    // Create resume record (only store extracted text, not the file)
    const resume = await Resume.create({
      originalName: file.originalname,
      fileName: file.originalname, // Use original filename
      fileSize: file.size,
      mimeType: file.mimetype,
      extractedText: extractedText.trim(),
      textLength: extractedText.trim().length,
    });

    console.log("Resume created in service:", resume);
    console.log("Resume _id in service:", resume._id);
    console.log("Resume _id type in service:", typeof resume._id);

    return resume;
  } catch (error) {
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

  // Delete from database only (no files to delete from filesystem)
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
