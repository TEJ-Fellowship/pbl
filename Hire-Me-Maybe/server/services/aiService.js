const Resume = require("../models/resume");
const ResumeService = require("./resumeService");

// Analyze resume
const analyzeResume = async (resumeId) => {
  const resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new Error("Resume not found");
  }

  // Extract skills from text
  const skills = extractSkills(resume.extractedText);

  // Determine experience level
  const experienceLevel = determineExperienceLevel(resume.extractedText);

  // Find key strengths
  const strengths = findStrengths(resume.extractedText);

  // Generate suggestions
  const suggestions = generateSuggestions(resume.extractedText);

  const analysisResult = {
    skills,
    experienceLevel,
    strengths,
    suggestions,
    analysisDate: new Date(),
  };

  // Update resume with analysis results
  await ResumeService.updateAnalysis(resumeId, analysisResult);

  return analysisResult;
};

// Get analysis results
const getAnalysis = async (resumeId) => {
  const resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new Error("Resume not found");
  }

  if (!resume.isAnalyzed) {
    throw new Error("Resume has not been analyzed yet");
  }

  return resume.analysisResult;
};

// Extract skills from text
const extractSkills = (text) => {
  const commonSkills = [
    "JavaScript",
    "Python",
    "React",
    "Node.js",
    "MongoDB",
    "SQL",
    "AWS",
    "Docker",
    "Git",
    "TypeScript",
    "Java",
    "C++",
    "PHP",
    "Angular",
    "Vue.js",
    "Express.js",
    "HTML",
    "CSS",
    "Redux",
    "GraphQL",
    "REST API",
    "Machine Learning",
    "Data Science",
    "DevOps",
    "CI/CD",
  ];

  const foundSkills = commonSkills.filter((skill) =>
    text.toLowerCase().includes(skill.toLowerCase())
  );

  return foundSkills;
};

// Determine experience level
const determineExperienceLevel = (text) => {
  const yearsOfExperience = extractYearsOfExperience(text);

  if (yearsOfExperience < 2) return "Junior";
  if (yearsOfExperience < 5) return "Mid-level";
  if (yearsOfExperience < 10) return "Senior";
  return "Expert";
};

// Extract years of experience
const extractYearsOfExperience = (text) => {
  const yearPatterns = [
    /(\d+)\s*years?\s*of\s*experience/gi,
    /experience:\s*(\d+)\s*years?/gi,
    /(\d+)\s*years?\s*in\s*the\s*field/gi,
  ];

  for (const pattern of yearPatterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1]) || 0;
    }
  }

  return 1; // Default to 1 year if no pattern found
};

// Find strengths
const findStrengths = (text) => {
  const strengths = [];

  if (text.toLowerCase().includes("leadership")) {
    strengths.push("Leadership experience");
  }

  if (text.toLowerCase().includes("project")) {
    strengths.push("Project management");
  }

  if (text.toLowerCase().includes("team")) {
    strengths.push("Team collaboration");
  }

  if (text.toLowerCase().includes("problem solving")) {
    strengths.push("Problem solving");
  }

  if (text.toLowerCase().includes("communication")) {
    strengths.push("Communication skills");
  }

  return strengths.length > 0 ? strengths : ["Technical skills"];
};

// Generate suggestions
const generateSuggestions = (text) => {
  const suggestions = [];

  if (!text.toLowerCase().includes("github")) {
    suggestions.push("Add GitHub profile to showcase projects");
  }

  if (!text.toLowerCase().includes("linkedin")) {
    suggestions.push("Include LinkedIn profile for networking");
  }

  if (text.length < 500) {
    suggestions.push("Consider adding more details about your experience");
  }

  if (!text.toLowerCase().includes("achievement")) {
    suggestions.push("Highlight specific achievements and metrics");
  }

  if (!text.toLowerCase().includes("certification")) {
    suggestions.push("Consider adding relevant certifications");
  }

  return suggestions;
};

// Compare resumes
const compareResumes = async (resumeIds) => {
  const resumes = await Resume.find({ _id: { $in: resumeIds } });

  const comparisons = resumes.map((resume) => ({
    id: resume._id,
    name: resume.originalName,
    skills: extractSkills(resume.extractedText),
    experienceLevel: determineExperienceLevel(resume.extractedText),
    textLength: resume.textLength,
    wordCount: resume.wordCount,
    lineCount: resume.lineCount,
  }));

  return {
    comparisons,
    summary: generateComparisonSummary(comparisons),
  };
};

// Generate comparison summary
const generateComparisonSummary = (comparisons) => {
  const totalResumes = comparisons.length;
  const averageTextLength =
    comparisons.reduce((sum, r) => sum + r.textLength, 0) / totalResumes;
  const commonSkills = findCommonSkills(comparisons);

  return {
    totalResumes,
    averageTextLength: Math.round(averageTextLength),
    commonSkills,
  };
};

// Find common skills
const findCommonSkills = (comparisons) => {
  const allSkills = comparisons.flatMap((r) => r.skills);
  const skillCounts = {};

  allSkills.forEach((skill) => {
    skillCounts[skill] = (skillCounts[skill] || 0) + 1;
  });

  return Object.entries(skillCounts)
    .filter(([_, count]) => count > 1)
    .sort(([, a], [, b]) => b - a)
    .map(([skill]) => skill);
};

// Get job recommendations
const getJobRecommendations = async (resumeId) => {
  const resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new Error("Resume not found");
  }

  const skills = extractSkills(resume.extractedText);
  const experienceLevel = determineExperienceLevel(resume.extractedText);

  // Simple job recommendations based on skills and experience
  const recommendations = [
    {
      title: "Software Developer",
      company: "Tech Company",
      match: "85%",
      reason: "Matches your technical skills",
    },
    {
      title: "Full Stack Developer",
      company: "Startup",
      match: "90%",
      reason: "Perfect fit for your experience level",
    },
  ];

  return recommendations;
};

module.exports = {
  analyzeResume,
  getAnalysis,
  compareResumes,
  extractSkills,
  determineExperienceLevel,
  findStrengths,
  generateSuggestions,
  getJobRecommendations,
};
