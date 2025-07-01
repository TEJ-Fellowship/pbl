const Resume = require("../models/resume");
const CustomizedResume = require("../models/customizedResume");

// Customize resume for specific job
const customizeResume = async (resumeId, jobDetails) => {
  const resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new Error("Resume not found");
  }

  // AI-powered customization logic
  const customizedText = await performAICustomization(
    resume.extractedText,
    jobDetails
  );

  // Generate customization summary
  const customizationSummary = generateCustomizationSummary(
    resume.extractedText,
    customizedText,
    jobDetails
  );

  return {
    customizedText,
    customizationSummary,
    originalText: resume.extractedText,
  };
};

// AI-powered customization
const performAICustomization = async (originalText, jobDetails) => {
  // This is a simplified AI customization
  // In a real implementation, you would use OpenAI API or similar

  let customizedText = originalText;
  const changes = [];

  // 1. Add job-specific keywords
  const keywordsToAdd = extractKeywordsFromJobDetails(jobDetails);
  if (keywordsToAdd.length > 0) {
    customizedText = addKeywordsToResume(customizedText, keywordsToAdd);
    changes.push(`Added ${keywordsToAdd.length} job-specific keywords`);
  }

  // 2. Modify experience descriptions
  customizedText = enhanceExperienceDescriptions(customizedText, jobDetails);
  changes.push("Enhanced experience descriptions");

  // 3. Optimize skills section
  customizedText = optimizeSkillsSection(customizedText, jobDetails);
  changes.push("Optimized skills section");

  // 4. Add relevant achievements
  customizedText = addRelevantAchievements(customizedText, jobDetails);
  changes.push("Added relevant achievements");

  return customizedText;
};

// Extract keywords from job details
const extractKeywordsFromJobDetails = (jobDetails) => {
  const keywords = [];

  // Extract from job title
  if (jobDetails.jobTitle) {
    const titleKeywords = jobDetails.jobTitle.toLowerCase().split(" ");
    keywords.push(...titleKeywords.filter((word) => word.length > 3));
  }

  // Extract from requirements
  if (jobDetails.requirements) {
    const requirementKeywords =
      jobDetails.requirements.toLowerCase().match(/\b\w{4,}\b/g) || [];
    keywords.push(...requirementKeywords.slice(0, 10)); // Limit to 10 keywords
  }

  // Add industry-specific keywords
  if (jobDetails.industry) {
    const industryKeywords = getIndustryKeywords(jobDetails.industry);
    keywords.push(...industryKeywords);
  }

  return [...new Set(keywords)]; // Remove duplicates
};

// Get industry-specific keywords
const getIndustryKeywords = (industry) => {
  const industryKeywords = {
    technology: [
      "software",
      "development",
      "programming",
      "coding",
      "agile",
      "scrum",
      "api",
      "database",
      "cloud",
      "devops",
    ],
    finance: [
      "financial",
      "analysis",
      "budgeting",
      "forecasting",
      "risk",
      "compliance",
      "audit",
      "investment",
      "portfolio",
    ],
    healthcare: [
      "patient",
      "clinical",
      "medical",
      "healthcare",
      "treatment",
      "diagnosis",
      "care",
      "nursing",
      "pharmacy",
    ],
    education: [
      "teaching",
      "curriculum",
      "student",
      "learning",
      "education",
      "academic",
      "assessment",
      "instruction",
    ],
    marketing: [
      "marketing",
      "campaign",
      "brand",
      "social media",
      "content",
      "analytics",
      "seo",
      "advertising",
    ],
    consulting: [
      "consulting",
      "strategy",
      "analysis",
      "client",
      "project",
      "solution",
      "implementation",
    ],
  };

  return industryKeywords[industry] || [];
};

// Add keywords to resume
const addKeywordsToResume = (text, keywords) => {
  // Add keywords to skills section or create one if it doesn't exist
  const skillsSection = extractSkillsSection(text);
  if (skillsSection) {
    const enhancedSkills = [...new Set([...skillsSection, ...keywords])];
    return text.replace(
      /skills?:.*?(?=\n\n|\n[A-Z]|$)/is,
      `Skills: ${enhancedSkills.join(", ")}`
    );
  } else {
    return text + `\n\nSkills: ${keywords.join(", ")}`;
  }
};

// Extract skills section from text
const extractSkillsSection = (text) => {
  const skillsMatch = text.match(/skills?:.*?(?=\n\n|\n[A-Z]|$)/is);
  if (skillsMatch) {
    return skillsMatch[0]
      .replace(/skills?:/i, "")
      .trim()
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter((s) => s);
  }
  return [];
};

// Enhance experience descriptions
const enhanceExperienceDescriptions = (text, jobDetails) => {
  // This is a simplified enhancement
  // In a real implementation, you would use more sophisticated NLP

  let enhancedText = text;

  // Add action verbs if missing
  const actionVerbs = [
    "developed",
    "implemented",
    "managed",
    "led",
    "created",
    "designed",
    "optimized",
  ];
  const sentences = enhancedText.split(/[.!?]+/);

  const enhancedSentences = sentences.map((sentence) => {
    if (
      sentence.trim().length > 10 &&
      !actionVerbs.some((verb) => sentence.toLowerCase().includes(verb))
    ) {
      return sentence.trim() + " (enhanced with relevant action verbs)";
    }
    return sentence.trim();
  });

  return enhancedSentences.join(". ") + ".";
};

// Optimize skills section
const optimizeSkillsSection = (text, jobDetails) => {
  // Reorganize skills to prioritize job-relevant ones
  const skills = extractSkillsSection(text);
  if (skills.length === 0) return text;

  const jobKeywords = extractKeywordsFromJobDetails(jobDetails);
  const relevantSkills = skills.filter((skill) =>
    jobKeywords.some((keyword) => skill.toLowerCase().includes(keyword))
  );
  const otherSkills = skills.filter(
    (skill) =>
      !jobKeywords.some((keyword) => skill.toLowerCase().includes(keyword))
  );

  const optimizedSkills = [...relevantSkills, ...otherSkills];

  return text.replace(
    /skills?:.*?(?=\n\n|\n[A-Z]|$)/is,
    `Skills: ${optimizedSkills.join(", ")}`
  );
};

// Add relevant achievements
const addRelevantAchievements = (text, jobDetails) => {
  // Add template achievements based on job details
  const achievements = [
    "Improved efficiency by 25% through process optimization",
    "Led team of 5 developers to deliver project on time",
    "Reduced costs by 15% through strategic planning",
    "Increased customer satisfaction by 30%",
  ];

  const relevantAchievement =
    achievements[Math.floor(Math.random() * achievements.length)];

  if (!text.toLowerCase().includes("achievement")) {
    return text + `\n\nKey Achievement: ${relevantAchievement}`;
  }

  return text;
};

// Generate customization summary
const generateCustomizationSummary = (
  originalText,
  customizedText,
  jobDetails
) => {
  const keywordsAdded = extractKeywordsFromJobDetails(jobDetails);
  const sectionsModified = [];

  if (customizedText !== originalText) {
    sectionsModified.push("Skills", "Experience", "Achievements");
  }

  const relevanceScore = calculateRelevanceScore(customizedText, jobDetails);
  const changesMade = [
    `Customized for ${jobDetails.company} - ${jobDetails.jobTitle}`,
    `Added ${keywordsAdded.length} relevant keywords`,
    `Enhanced experience descriptions`,
    `Optimized skills section`,
  ];

  return {
    keywordsAdded,
    sectionsModified,
    relevanceScore,
    changesMade,
  };
};

// Calculate relevance score
const calculateRelevanceScore = (text, jobDetails) => {
  const jobKeywords = extractKeywordsFromJobDetails(jobDetails);
  const textWords = text.toLowerCase().split(/\s+/);

  let matches = 0;
  jobKeywords.forEach((keyword) => {
    if (textWords.some((word) => word.includes(keyword))) {
      matches++;
    }
  });

  const score = Math.round((matches / jobKeywords.length) * 100);
  return Math.min(score, 100);
};

// Save customized resume
const saveCustomizedResume = async (resumeId, jobDetails, customizedData) => {
  const customizedResume = new CustomizedResume({
    originalResumeId: resumeId,
    jobDetails,
    customizedText: customizedData.customizedText,
    customizationSummary: customizedData.customizationSummary,
  });

  await customizedResume.save();
  return customizedResume;
};

// Get saved versions
const getSavedVersions = async (resumeId) => {
  return CustomizedResume.find({ originalResumeId: resumeId }).sort({
    createdAt: -1,
  });
};

// Get specific saved version
const getSavedVersion = async (resumeId, versionId) => {
  return CustomizedResume.findOne({
    _id: versionId,
    originalResumeId: resumeId,
  });
};

// Delete saved version
const deleteSavedVersion = async (resumeId, versionId) => {
  return CustomizedResume.findOneAndDelete({
    _id: versionId,
    originalResumeId: resumeId,
  });
};

module.exports = {
  customizeResume,
  saveCustomizedResume,
  getSavedVersions,
  getSavedVersion,
  deleteSavedVersion,
};
