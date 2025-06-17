const express = require("express");
const router = express.Router();
const Quiz = require("../models/quizModel");

// GET all quizzes
router.get("/", async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({});
    res.json(quizzes);
  } catch (error) {
    next(error);
  }
});

// GET single quiz
router.get("/:id", async (req, res, next) => {
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
});

// POST create new quiz
router.post("/", async (req, res, next) => {
  try {
    const { userId, title, topic, questions } = req.body;

    const quiz = new Quiz({
      userId,
      title,
      topic,
      questions,
      attempts: [], // Initialize empty attempts array
    });

    const savedQuiz = await quiz.save();
    res.status(201).json(savedQuiz);
  } catch (error) {
    next(error);
  }
});

// PUT update quiz
router.put("/:id", async (req, res, next) => {
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
});

// POST record quiz attempt
router.post("/:id/attempts", async (req, res, next) => {
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
});

// GET quiz attempts
router.get("/:id/attempts", async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    res.json(quiz.attempts);
  } catch (error) {
    next(error);
  }
});

// DELETE quiz
router.delete("/:id", async (req, res, next) => {
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
});

module.exports = router;
