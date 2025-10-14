import axios from "axios";

const API_BASE_URL = "http://localhost:3001/api";

const musicService = {
  // Get all available music tracks
  getAllMusic: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/music`);
      return response.data;
    } catch (error) {
      console.error("Error fetching music:", error);
      throw error;
    }
  },

  // Get music by genre
  getMusicByGenre: async (genre) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/music/genre/${genre}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching music by genre:", error);
      throw error;
    }
  },

  // Seed database with sample music (for testing)
  seedMusic: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/music/seed`);
      return response.data;
    } catch (error) {
      console.error("Error seeding music:", error);
      throw error;
    }
  },
};

export default musicService;
