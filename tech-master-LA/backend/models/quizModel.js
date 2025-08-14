// tech-master-LA/backend/models/quizModel.js
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correct: String,
});

const attemptSchema = new mongoose.Schema({
  userAnswers: {
    type: Map,
    of: String,
    required: false,
  },
  score: {
    type: Number,
    required: false,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["in_progress", "completed", "abandoned"],
    default: "in_progress",
  },
  date: { type: Date, default: Date.now },
});

const quizSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Changed from ObjectId to String
      required: false, // Made it optional
    },
    createdBy: {
      type: String,
      required: true,
      default: "Anonymous", // Default value if no user is specified
    },
    title: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    questions: {
      type: [questionSchema],
      required: true,
      validate: [
        (array) => array.length > 0,
        "Quiz must have at least one question",
      ],
    },
    attempts: {
      type: [attemptSchema],
      validate: {
        validator: function (attempts) {
          // Ensure only one incomplete attempt per quiz
          const incompleteCount = attempts.filter(
            (att) => !att.completed && att.status !== "abandoned"
          ).length;
          return incompleteCount <= 1;
        },
        message: "Only one incomplete attempt allowed per quiz",
      },
    },
  },
  {
    timestamps: true, // Enable timestamps (createdAt and updatedAt)
  }
);

// Add index for better performance
quizSchema.index({ userId: 1, createdAt: -1 });

// Add method to get only completed attempts
quizSchema.methods.getCompletedAttempts = function () {
  return this.attempts.filter((att) => att.completed);
};

// Add method to get current incomplete attempt
quizSchema.methods.getCurrentAttempt = function () {
  return this.attempts.find(
    (att) => !att.completed && att.status !== "abandoned"
  );
};

// Add method to cleanup incomplete attempts
quizSchema.methods.cleanupIncompleteAttempts = function () {
  this.attempts = this.attempts.filter(
    (att) => att.completed || att.status === "abandoned"
  );
  return this;
};

module.exports = mongoose.model("Quiz", quizSchema);
