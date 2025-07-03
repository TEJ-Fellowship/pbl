const AiService = require("../services/aiService");
const { asyncHandler } = require("../utils/asyncHandler");

// Analyze resume
const analyzeResume = asyncHandler(async (req, res) => {
  console.log("Analyze resume called with ID:", req.params.id);
  console.log("ID type:", typeof req.params.id);
  console.log("ID length:", req.params.id?.length);

  const analysis = await AiService.analyzeResume(req.params.id);

  console.log("=== ANALYSIS RESULT ===");
  console.log("Analysis object:", analysis);
  console.log("Skills:", analysis.skills);
  console.log("Experience Level:", analysis.experienceLevel);
  console.log("Strengths:", analysis.strengths);
  console.log("Suggestions:", analysis.suggestions);

  res.json({
    success: true,
    message: "Resume analyzed successfully",
    data: analysis,
  });
});

// Get analysis results
const getAnalysis = asyncHandler(async (req, res) => {
  const analysis = await AiService.getAnalysis(req.params.id);

  res.json({
    success: true,
    message: "Analysis retrieved successfully",
    data: analysis,
  });
});

// Compare resumes
const compareResumes = asyncHandler(async (req, res) => {
  const { resumeIds } = req.body;

  if (!resumeIds || !Array.isArray(resumeIds) || resumeIds.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Please provide at least 2 resume IDs to compare",
    });
  }

  const comparison = await AiService.compareResumes(resumeIds);

  res.json({
    success: true,
    message: "Resumes compared successfully",
    data: comparison,
  });
});

// Extract skills from text
const extractSkills = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      success: false,
      message: "Text is required",
    });
  }

  const skills = AiService.extractSkills(text);

  res.json({
    success: true,
    message: "Skills extracted successfully",
    data: { skills },
  });
});

// Get job recommendations
const getJobRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await AiService.getJobRecommendations(req.params.id);

  res.json({
    success: true,
    message: "Job recommendations retrieved successfully",
    data: recommendations,
  });
});

module.exports = {
  analyzeResume,
  getAnalysis,
  compareResumes,
  extractSkills,
  getJobRecommendations,
};
