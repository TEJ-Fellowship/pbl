import axios from "axios";
import config from "../config/config";

export const fetchQuizStats = async () => {
  try {
    const response = await axios.get(`${config.API_BASE_URL}/stats`);
    return response.data;
  } catch (error) {
    console.error("Error fetching quiz stats:", error);
    throw error;
  }
};
