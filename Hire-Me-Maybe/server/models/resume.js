const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileType: {
      type: String,
      default: "application/pdf",
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    isAnalyzed: {
      type: Boolean,
      default: false,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    analysisResult: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    versions: [
      {
        versionName: {
          type: String,
          required: true,
        },
        jobDetails: {
          company: String,
          jobTitle: String,
          role: String,
          industry: String,
          requirements: String,
          location: String,
          salary: String,
        },
        customizedContent: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    tags: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["active", "archived", "deleted"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
resumeSchema.index({ userId: 1, uploadDate: -1 });
resumeSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Resume", resumeSchema);
