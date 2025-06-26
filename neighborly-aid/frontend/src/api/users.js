import axios from "axios";
import config from "../config/config";

const getUserDashboard = async (userId) => {
  try {
    const response = await axios.get(
      `${config.API_BASE_URL}/api/users/${userId}`,
      { withCredentials: true }
    );
    console.log("response in api", response.data);
    return response;
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    throw error; // Re-throw the error so the component can handle it
  }
};

export { getUserDashboard };
