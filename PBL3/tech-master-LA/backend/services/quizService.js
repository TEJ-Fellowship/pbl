const Quiz = require("../models/quizModel");
const User = require("../models/User");
const geminiService = require("./geminiService");

class QuizService {
  async getQuizzes(userId) {
    return await Quiz.find({ userId }).sort({ createdAt: -1 });
  }

  async getQuiz(quizId, userId) {
    const quiz = await Quiz.findOne({ _id: quizId, userId });
    if (!quiz) throw new Error("Quiz not found or access denied");
    return quiz;
  }

  async createQuiz(topic, userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const questions = await geminiService.generateQuizQuestions(topic);

    const newQuiz = new Quiz({
      topic,
      title: `${topic} Quiz`,
      questions: questions.map((q) => ({
        question: q.question,
        options: q.options,
        correct: q.correctAnswer,
      })),
      userId,
      createdBy: user.name,
    });
    return await newQuiz.save();
  }

  async deleteQuiz(quizId, userId) {
    const result = await Quiz.findOneAndDelete({ _id: quizId, userId });
    if (!result) throw new Error("Quiz not found or access denied");
    return result;
  }

  async startQuiz(quizId, userId) {
    const quiz = await this.getQuiz(quizId, userId);

    // Clean up any abandoned attempts first
    quiz.cleanupIncompleteAttempts();

    // Check for existing incomplete attempt
    const existingAttempt = quiz.getCurrentAttempt();

    if (existingAttempt) {
      await quiz.save();
      return { quiz, attempt: existingAttempt };
    }

    // Create new attempt
    const newAttempt = {
      userAnswers: {},
      score: 0,
      completed: false,
      status: "in_progress",
      date: new Date(),
    };

    quiz.attempts.push(newAttempt);
    await quiz.save();

    const savedAttempt = quiz.attempts[quiz.attempts.length - 1];
    return { quiz, attempt: savedAttempt };
  }

  async saveProgress(quizId, attemptId, userAnswers, userId) {
    const quiz = await this.getQuiz(quizId, userId);
    const attempt = quiz.attempts.id(attemptId);

    if (!attempt) throw new Error("Attempt not found");
    if (attempt.completed)
      throw new Error("Cannot save progress for a completed quiz");
    if (attempt.status === "abandoned")
      throw new Error("Cannot save progress for an abandoned attempt");

    attempt.userAnswers = userAnswers;
    attempt.status = "in_progress";
    await quiz.save();
    return attempt;
  }

  async submitQuiz(quizId, attemptId, userAnswers, userId) {
    const quiz = await this.getQuiz(quizId, userId);
    const attempt = quiz.attempts.id(attemptId);

    if (!attempt) throw new Error("Attempt not found");
    if (attempt.completed) throw new Error("Quiz already submitted");
    if (attempt.status === "abandoned")
      throw new Error("Cannot submit an abandoned attempt");

    let score = 0;
    quiz.questions.forEach((question, index) => {
      if (question.correct === userAnswers[index]) {
        score++;
      }
    });

    attempt.userAnswers = userAnswers;
    attempt.score = (score / quiz.questions.length) * 100;
    attempt.completed = true;
    attempt.status = "completed";
    attempt.date = new Date();

    await quiz.save();
    return attempt;
  }

  async abandonAttempt(quizId, attemptId, userId) {
    const quiz = await this.getQuiz(quizId, userId);
    const attempt = quiz.attempts.id(attemptId);

    if (!attempt) throw new Error("Attempt not found");
    if (attempt.completed)
      throw new Error("Cannot abandon a completed attempt");

    attempt.status = "abandoned";
    await quiz.save();
    return attempt;
  }

  async cleanupIncompleteAttempts(quizId, userId) {
    const quiz = await this.getQuiz(quizId, userId);
    quiz.cleanupIncompleteAttempts();
    await quiz.save();
    return quiz;
  }

  async regenerateQuiz(quizId, userId) {
    const originalQuiz = await this.getQuiz(quizId, userId);
    const newQuestions = await geminiService.generateQuizQuestions(
      originalQuiz.topic,
      5
    );

    originalQuiz.questions = newQuestions.map((q) => ({
      question: q.question,
      options: q.options,
      correct: q.correctAnswer,
    }));

    // Mark all incomplete attempts as abandoned instead of deleting
    originalQuiz.attempts.forEach((attempt) => {
      if (!attempt.completed) {
        attempt.status = "abandoned";
      }
    });

    await originalQuiz.save();
    return originalQuiz;
  }

  async getQuizStats(quizId, userId) {
    const quiz = await this.getQuiz(quizId, userId);
    const completedAttempts = quiz.getCompletedAttempts();

    return {
      totalAttempts: completedAttempts.length,
      bestScore:
        completedAttempts.length > 0
          ? Math.max(...completedAttempts.map((a) => a.score || 0))
          : 0,
      averageScore:
        completedAttempts.length > 0
          ? (
              completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) /
              completedAttempts.length
            ).toFixed(2)
          : 0,
      latestScore:
        completedAttempts.length > 0
          ? completedAttempts[completedAttempts.length - 1].score
          : null,
    };
  }
}

module.exports = new QuizService();
