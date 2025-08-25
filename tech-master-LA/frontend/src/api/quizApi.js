import axios from "axios";
import config from "../config/config";

const api = axios.create({
  baseURL: `${config.API_BASE_URL || "http://localhost:5000"}/api`,
  withCredentials: true,
  headers: {
    // ... existing code ...
  },
});

export const quizApi = {
  // Get all quizzes for current user
  getQuizzes: async () => {
    const response = await api.get("/quiz");
    return response.data;
  },

  // Get specific quiz
  getQuiz: async (quizId) => {
    const response = await api.get(`/quiz/${quizId}`);
    return response.data;
  },

  // Create new quiz
  createQuiz: async (topic) => {
    try {
      const response = await api.post("/quiz", { topic });
      return response.data;
    } catch (error) {
      console.error("Error creating quiz:", error);
      throw error.response?.data || error;
    }
  },

  // Update quiz
  updateQuiz: async (quizId, quizData) => {
    const response = await api.put(`/quiz/${quizId}`, quizData);
    return response.data;
  },

  // Record quiz attempt
  recordAttempt: async (quizId, score) => {
    const response = await api.post(`/quiz/${quizId}/attempts`, {
      score,
    });
    return response.data;
  },

  // Get quiz attempts
  getAttempts: async (quizId) => {
    const response = await api.get(`/quiz/${quizId}/attempts`);
    return response.data;
  },

  // Delete quiz
  deleteQuiz: async (quizId) => {
    const response = await api.delete(`/quiz/${quizId}`);
    return response.data;
  },

  async startQuiz(quizId) {
    try {
      const response = await api.post(`/quiz/${quizId}/start`);
      return response.data.data;
    } catch (error) {
      console.error(`Error starting quiz ${quizId}:`, error);
      throw error.response?.data || error;
    }
  },

  async saveProgress(quizId, attemptId, userAnswers) {
    try {
      const response = await api.post(`/quiz/${quizId}/save`, {
        attemptId,
        userAnswers,
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error saving progress for quiz ${quizId}:`, error);
      throw error.response?.data || error;
    }
  },

  async submitQuiz(quizId, attemptId, userAnswers) {
    try {
      const response = await api.post(`/quiz/${quizId}/submit`, {
        attemptId,
        userAnswers,
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error submitting quiz ${quizId}:`, error);
      throw error.response?.data || error;
    }
  },

  async regenerateQuiz(quizId) {
    try {
      const response = await api.post(`/quiz/${quizId}/regenerate`);
      return response.data.data;
    } catch (error) {
      console.error(`Error regenerating quiz ${quizId}:`, error);
      throw error.response?.data || error;
    }
  },
};
