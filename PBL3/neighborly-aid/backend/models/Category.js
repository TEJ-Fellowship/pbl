const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  icon: {
    type: String,
    required: true,
    maxlength: 10, // For emojis or short icon classes
  },
  description: {
    type: String,
    maxlength: 200,
    default: "",
  },
  color: {
    type: String,
    default: "#6B7280", // Default gray color
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, // Hex color validation
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  lastUsed: {
    type: Date,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // System categories don't need a creator
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
categorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for performance
categorySchema.index({ isActive: 1, sortOrder: 1 });
categorySchema.index({ usageCount: -1 });
categorySchema.index({ lastUsed: -1 });

module.exports = mongoose.model("Category", categorySchema);
