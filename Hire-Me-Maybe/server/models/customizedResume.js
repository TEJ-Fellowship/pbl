const mongoose = require("mongoose");

const customizedResumeSchema = new mongoose.Schema(
  {
    originalResumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    jobDetails: {
      company: {
        type: String,
        required: true,
      },
      jobTitle: {
        type: String,
        required: true,
      },
      role: String,
      industry: String,
      requirements: String,
    },
    customizedText: {
      type: String,
      required: true,
    },
    customizationSummary: {
      keywordsAdded: [String],
      sectionsModified: [String],
      relevanceScore: Number,
      changesMade: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
customizedResumeSchema.index({ originalResumeId: 1, createdAt: -1 });
customizedResumeSchema.index({
  "jobDetails.company": 1,
  "jobDetails.jobTitle": 1,
});

const CustomizedResume = mongoose.model(
  "CustomizedResume",
  customizedResumeSchema
);

module.exports = CustomizedResume;
