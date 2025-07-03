import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export const aiService = {
  // Analyze resume
  analyzeResume: async (resumeId) => {
    return axios.post(`${API_BASE_URL}/resumes/${resumeId}/analyze`);
  },

  // Get analysis results
  getAnalysis: async (resumeId) => {
    return axios.get(`${API_BASE_URL}/resumes/${resumeId}`);
  },

  // Compare multiple resumes
  compareResumes: async (resumeIds) => {
    return axios.post(`${API_BASE_URL}/resumes/compare`, { resumeIds });
  },

  // Extract skills from text
  extractSkills: async (text) => {
    return axios.post(`${API_BASE_URL}/resumes/extract-skills`, { text });
  },

  // Get job recommendations
  getJobRecommendations: async (resumeId) => {
    return axios.get(`${API_BASE_URL}/resumes/${resumeId}/recommendations`);
  },
};
