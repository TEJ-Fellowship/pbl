// controllers/quizController.js

const Quiz = require("../models/quizModel");

const getAllQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({});
    res.json(quizzes);
  } catch (error) {
    next(error);
  }
};

const getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (quiz) {
      res.json(quiz);
    } else {
      res.status(404).json({ error: "Quiz not found" });
    }
  } catch (error) {
    next(error);
  }
};

const createQuiz = async (req, res, next) => {
  try {
    const { userId, title, topic, questions } = req.body;

    const quiz = new Quiz({
      userId,
      title,
      topic,
      questions,
      attempts: [],
    });

    const savedQuiz = await quiz.save();
    res.status(201).json(savedQuiz);
  } catch (error) {
    next(error);
  }
};

const updateQuiz = async (req, res, next) => {
  try {
    const { title, topic, questions } = req.body;

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { title, topic, questions },
      { new: true, runValidators: true }
    );

    if (updatedQuiz) {
      res.json(updatedQuiz);
    } else {
      res.status(404).json({ error: "Quiz not found" });
    }
  } catch (error) {
    next(error);
  }
};

const recordAttempt = async (req, res, next) => {
  try {
    const { score } = req.body;

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    quiz.attempts.push({ score });
    const updatedQuiz = await quiz.save();

    res.status(201).json(updatedQuiz);
  } catch (error) {
    next(error);
  }
};

const getAttempts = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    res.json(quiz.attempts);
  } catch (error) {
    next(error);
  }
};

const deleteQuiz = async (req, res, next) => {
  try {
    const deletedQuiz = await Quiz.findByIdAndDelete(req.params.id);
    if (deletedQuiz) {
      res.status(204).end();
    } else {
      res.status(404).json({ error: "Quiz not found" });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  recordAttempt,
  getAttempts,
  deleteQuiz,
};
