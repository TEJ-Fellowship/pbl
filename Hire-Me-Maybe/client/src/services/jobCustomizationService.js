import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export const jobCustomizationService = {
  // Customize resume for specific job
  customizeResume: async (resumeId, jobDetails) => {
    return axios.post(`${API_BASE_URL}/customize/${resumeId}`, jobDetails);
  },

  // Save customized resume version
  saveCustomizedResume: async (resumeId, jobDetails, customizedResume) => {
    return axios.post(`${API_BASE_URL}/customize/${resumeId}/save`, {
      jobDetails,
      customizedResume,
    });
  },

  // Get all saved versions for a resume
  getSavedVersions: async (resumeId) => {
    return axios.get(`${API_BASE_URL}/customize/${resumeId}/versions`);
  },

  // Get specific saved version
  getSavedVersion: async (resumeId, versionId) => {
    return axios.get(
      `${API_BASE_URL}/customize/${resumeId}/versions/${versionId}`
    );
  },

  // Delete saved version
  deleteSavedVersion: async (resumeId, versionId) => {
    return axios.delete(
      `${API_BASE_URL}/customize/${resumeId}/versions/${versionId}`
    );
  },
};
