import axios from "axios";
import config from "../config/config.js";

const registerAuth = async (data) => {
  try {
    console.log("register in auth api", data);
    const response = await axios.post(
      `${config.API_BASE_URL}/api/auth/register`,
      data,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "User registration failed:",
      error.response?.data?.error || error.message
    );
    return { success: false, error: error.response?.data?.error };
  }
};

const loginAuth = async (data) => {
  try {
    console.log("login in auth api", data);
    const response = await axios.post(
      `${config.API_BASE_URL}/api/auth/login`,
      data,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Login failed:",
      error.response?.data?.error || error.message
    );
    return { success: false, error: error.response?.data?.error };
  }
};

const logoutAuth = async () => {
  try {
    const response = await axios.post(
      `${config.API_BASE_URL}/api/auth/logout`,
      {},
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Logout failed:",
      error.response?.data?.error || error.message
    );
    return { success: false, error: error.response?.data?.error };
  }
};

const verifyAuth = async () => {
  try {
    const response = await axios.get(`${config.API_BASE_URL}/api/auth/verify`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Auth verification failed:",
      error.response?.data || error.message
    );
    // Return a standard unauthenticated response on error
    return { authenticated: false, user: null };
  }
};

export { registerAuth, loginAuth, verifyAuth, logoutAuth };
