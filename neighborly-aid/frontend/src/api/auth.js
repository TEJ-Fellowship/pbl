import axios from "axios";
import config from "../config/config.js";

const register = async (data) => {
  try {
    console.log("register", data);
    const response = await axios.post(
      `${config.apiUrl}/api/auth/register`,
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

const login = async (data) => {
  try {
    console.log("login", data);
    const response = await axios.post(`${config.apiUrl}/api/auth/login`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Login failed:",
      error.response?.data?.error || error.message
    );
    return { success: false, error: error.response?.data?.error };
  }
};

export { register, login };
