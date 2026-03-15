// controllers/quizController.js

const quizService = require("../services/quizService");

const getQuizzes = async (req, res) => {
  try {
    const quizzes = await quizService.getQuizzes(req.user.id);
    res.status(200).json({ success: true, data: quizzes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getQuiz = async (req, res) => {
  try {
    const quiz = await quizService.getQuiz(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

const createQuiz = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res
        .status(400)
        .json({ success: false, error: "Topic is required" });
    }
    const newQuiz = await quizService.createQuiz(topic, req.user.id);
    res.status(201).json({ success: true, data: newQuiz });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const deleteQuiz = async (req, res) => {
  try {
    await quizService.deleteQuiz(req.params.id, req.user.id);
    res
      .status(200)
      .json({ success: true, message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

const startQuiz = async (req, res) => {
  try {
    const { quiz, attempt } = await quizService.startQuiz(
      req.params.id,
      req.user.id
    );
    res.status(200).json({ success: true, data: { quiz, attempt } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const saveProgress = async (req, res) => {
  try {
    const { attemptId, userAnswers } = req.body;
    const attempt = await quizService.saveProgress(
      req.params.id,
      attemptId,
      userAnswers,
      req.user.id
    );
    res.status(200).json({ success: true, data: attempt });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { attemptId, userAnswers } = req.body;
    const attempt = await quizService.submitQuiz(
      req.params.id,
      attemptId,
      userAnswers,
      req.user.id
    );
    res.status(200).json({ success: true, data: attempt });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const abandonAttempt = async (req, res) => {
  try {
    const { attemptId } = req.body;
    const attempt = await quizService.abandonAttempt(
      req.params.id,
      attemptId,
      req.user.id
    );
    res.status(200).json({ success: true, data: attempt });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const cleanupAttempts = async (req, res) => {
  try {
    const quiz = await quizService.cleanupIncompleteAttempts(
      req.params.id,
      req.user.id
    );
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getQuizStats = async (req, res) => {
  try {
    const stats = await quizService.getQuizStats(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const regenerateQuiz = async (req, res) => {
  try {
    const updatedQuiz = await quizService.regenerateQuiz(
      req.params.id,
      req.user.id
    );
    res.status(200).json({ success: true, data: updatedQuiz });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  getQuizzes,
  getQuiz,
  createQuiz,
  deleteQuiz,
  startQuiz,
  saveProgress,
  submitQuiz,
  abandonAttempt,
  cleanupAttempts,
  getQuizStats,
  regenerateQuiz,
};
