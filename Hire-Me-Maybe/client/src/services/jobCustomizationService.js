import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export const jobCustomizationService = {
  // Customize resume for specific job
  customizeResume: async (resumeId, jobDetails) => {
    return axios.post(`${API_BASE_URL}/resumes/${resumeId}/customize`, {
      jobDetails,
      versionName: `Customized for ${jobDetails.company}`,
    });
  },

  // Get saved versions of a resume
  getSavedVersions: async (resumeId) => {
    return axios.get(`${API_BASE_URL}/resumes/${resumeId}/versions`);
  },

  // Save a customized version
  saveCustomizedResume: async (resumeId, jobDetails, customizedContent) => {
    return axios.post(`${API_BASE_URL}/resumes/${resumeId}/customize`, {
      jobDetails,
      customizedContent,
      versionName: `Customized for ${jobDetails.company}`,
    });
  },

  // Get all resumes for the user
  getResumes: async () => {
    return axios.get(`${API_BASE_URL}/resumes`);
  },

  // Delete a resume
  deleteResume: async (resumeId) => {
    return axios.delete(`${API_BASE_URL}/resumes/${resumeId}`);
  },
};
