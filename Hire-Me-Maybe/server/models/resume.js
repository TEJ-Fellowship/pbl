const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: false,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      default: "application/pdf",
    },
    extractedText: {
      type: String,
      required: true,
    },
    textLength: {
      type: Number,
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    // AI Analysis fields
    isAnalyzed: {
      type: Boolean,
      default: false,
    },
    analysisResult: {
      skills: [String],
      experienceLevel: String,
      strengths: [String],
      suggestions: [String],
      analysisDate: Date,
    },
    // Metadata
    wordCount: {
      type: Number,
      default: 0,
    },
    lineCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
resumeSchema.index({ uploadDate: -1 });
resumeSchema.index({ extractedText: "text" });

// Pre-save middleware to calculate word and line counts
resumeSchema.pre("save", function (next) {
  if (this.extractedText) {
    this.wordCount = this.extractedText
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    this.lineCount = this.extractedText.split("\n").length;
  }
  next();
});

const Resume = mongoose.model("Resume", resumeSchema);

module.exports = Resume;
