import axios from "axios";

const api_key = import.meta.env.VITE_WEATHER_API_KEY;

export const getAirQualityData = async (country) => {
  try {
    const airQualityResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${country.lat}&lon=${country.lon}&appid=${api_key}`
    );
    return airQualityResponse.data;
  } catch (error) {
    throw error;
  }
};