import axios from "axios";
import config from "../config/config";

const getLeaderboardData = async () => {
  try {
    const response = await axios.get(`${config.API_BASE_URL}/api/leaderboard`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Leaderboard API error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

const getLeaderboardStats = async () => {
  try {
    const response = await axios.get(
      `${config.API_BASE_URL}/api/leaderboard/stats`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Leaderboard Stats API error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

export { getLeaderboardData, getLeaderboardStats };
