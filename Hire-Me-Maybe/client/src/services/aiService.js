import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api"||"https://pbl-t5f9.onrender.com/api";

export const aiService = {
  // Analyze resume
  analyzeResume: async (resumeId) => {
    return axios.post(`${API_BASE_URL}/ai/analyze/${resumeId}`);
  },

  // Get analysis results
  getAnalysis: async (resumeId) => {
    return axios.get(`${API_BASE_URL}/ai/analysis/${resumeId}`);
  },

  // Compare multiple resumes
  compareResumes: async (resumeIds) => {
    return axios.post(`${API_BASE_URL}/ai/compare`, { resumeIds });
  },

  // Extract skills from text
  extractSkills: async (text) => {
    return axios.post(`${API_BASE_URL}/ai/extract-skills`, { text });
  },

  // Get job recommendations
  getJobRecommendations: async (resumeId) => {
    return axios.get(`${API_BASE_URL}/ai/recommendations/${resumeId}`);
  },
};
