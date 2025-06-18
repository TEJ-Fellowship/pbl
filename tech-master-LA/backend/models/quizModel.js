// tech-master-LA/backend/models/quizModel.js
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correct: String,
});

const attemptSchema = new mongoose.Schema({
  score: Number,
  date: { type: Date, default: Date.now },
});

const quizSchema = new mongoose.Schema({
  userId: {
    type: String, // Changed from ObjectId to String
    required: false, // Made it optional
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
  attempts: [attemptSchema],
});

module.exports = mongoose.model("Quiz", quizSchema);
