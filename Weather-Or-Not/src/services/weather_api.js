import axios from "axios";

const api_key = import.meta.env.VITE_WEATHER_API_KEY;

export const getWeatherData = async (country) => {
  try {
    if (!country.capital) {
      throw new Error("Capital not found for this country");
    }

    const city = country.capital[0];
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${api_key}`
    );
    return weatherResponse.data;
  } catch (error) {
    throw error;
  }
};
