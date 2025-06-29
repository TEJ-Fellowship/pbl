const express = require("express");
const {
  analyzeResume,
  getAnalysis,
  compareResumes,
  extractSkills,
  getJobRecommendations,
} = require("../controllers/aiController");

const aiRouter = express.Router();

// AI Analysis routes
aiRouter.post("/analyze/:id", analyzeResume);
aiRouter.get("/analysis/:id", getAnalysis);
aiRouter.post("/compare", compareResumes);
aiRouter.post("/extract-skills", extractSkills);
aiRouter.get("/recommendations/:id", getJobRecommendations);

module.exports = aiRouter;
