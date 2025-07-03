const Resume = require("../models/resume");
const ResumeService = require("../services/resumeService");
const { asyncHandler } = require("../utils/asyncHandler");

// Upload resume
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please upload a PDF file",
    });
  }

  const resume = await ResumeService.uploadResume(req.file);

  console.log("Resume created:", resume);
  console.log("Resume _id:", resume._id);
  console.log("Resume _id type:", typeof resume._id);

  const responseData = {
    id: resume._id,
    originalName: resume.originalName,
    fileName: resume.fileName,
    fileSize: resume.fileSize,
    textLength: resume.textLength,
    wordCount: resume.wordCount,
    lineCount: resume.lineCount,
    uploadDate: resume.uploadDate,
    extractedText: resume.extractedText,
  };

  console.log("Response data being sent:", responseData);

  res.status(201).json({
    success: true,
    message: "Resume uploaded and processed successfully",
    data: responseData,
  });
});

// Get all resumes
const getAllResumes = asyncHandler(async (req, res) => {
  const resumes = await ResumeService.getAllResumes();

  res.json({
    success: true,
    message: "Resumes retrieved successfully",
    count: resumes.length,
    data: resumes.map((resume) => ({
      id: resume._id,
      originalName: resume.originalName,
      fileSize: resume.fileSize,
      textLength: resume.textLength,
      wordCount: resume.wordCount,
      lineCount: resume.lineCount,
      uploadDate: resume.uploadDate,
      isAnalyzed: resume.isAnalyzed,
    })),
  });
});

// Get specific resume
const getResumeById = asyncHandler(async (req, res) => {
  const resume = await ResumeService.getResumeById(req.params.id);

  res.json({
    success: true,
    message: "Resume retrieved successfully",
    data: resume,
  });
});

// Get resume text only
const getResumeText = asyncHandler(async (req, res) => {
  const resume = await ResumeService.getResumeById(req.params.id);

  res.json({
    success: true,
    message: "Resume text retrieved successfully",
    data: {
      id: resume._id,
      extractedText: resume.extractedText,
      textLength: resume.textLength,
      wordCount: resume.wordCount,
      lineCount: resume.lineCount,
    },
  });
});

// Delete resume
const deleteResume = asyncHandler(async (req, res) => {
  await ResumeService.deleteResume(req.params.id);

  res.json({
    success: true,
    message: "Resume deleted successfully",
  });
});

module.exports = {
  uploadResume,
  getAllResumes,
  getResumeById,
  getResumeText,
  deleteResume,
};
