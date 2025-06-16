import axios from "axios";

const api_key = import.meta.env.VITE_WEATHER_API_KEY;

export const reverseGeo = async (lat, lon) => {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${api_key}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 *
 * @param {string} search query e.g. 'New York'
 * @returns
 */
export const geo = async (query) => {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${api_key}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
