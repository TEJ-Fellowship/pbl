import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export const resumeService = {
  // Upload resume with progress tracking
  uploadResume: async (formData, config = {}) => {
    return axios.post(`${API_BASE_URL}/resumes/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      ...config,
    });
  },

  // Get all resumes
  getResumes: async () => {
    return axios.get(`${API_BASE_URL}/resumes`);
  },

  // Get specific resume
  getResume: async (id) => {
    return axios.get(`${API_BASE_URL}/resumes/${id}`);
  },

  // Delete resume
  deleteResume: async (id) => {
    return axios.delete(`${API_BASE_URL}/resumes/${id}`);
  },

  // Get resume text
  getResumeText: async (id) => {
    return axios.get(`${API_BASE_URL}/resumes/${id}/text`);
  },

  // Analyze resume
  analyzeResume: async (id) => {
    return axios.post(`${API_BASE_URL}/resumes/${id}/analyze`);
  },
};
