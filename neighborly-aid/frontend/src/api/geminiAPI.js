import axios from "axios";
import config from "../config/config";

/**
 * Get AI-powered suggestions for task category and urgency
 * @param {string} title - The task title
 * @param {string} description - The task description
 * @returns {Promise<{
 *   suggestedCategories: string[],
 *   suggestedUrgency: string,
 *   explanation: string
 * }>}
 */
export const getTaskSuggestions = async (title, description) => {
  try {
    const response = await axios.post(
      `${config.API_BASE_URL}/api/tasks/suggestions`,
      { title, description },
      {
        headers: {
          "Content-Type": "application/json",
        },
        // withCredentials: true, // Important for sending auth cookies
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || "Failed to get task suggestions";
  }
};
