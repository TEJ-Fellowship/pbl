import axios from "axios";
const api_key = import.meta.env.VITE_WEATHER_API_KEY;

const baseUrl = "https://studies.cs.helsinki.fi/restcountries/api/";
const baseUrl2 = "https://api.openweathermap.org/geo/1.0/direct";

export const getAllCountries = async () => {
  try {
    const response = await axios.get(`${baseUrl}/all`);
    return response.data;
  } catch (error) {
    //rethrow the error to be handled by the caller
    throw error;
  }
};

export const getCityCoordinates = async (cityName) => {
  try {
    const response = await axios.get(
      `${baseUrl2}?q=${cityName}&limit=1&appid=${api_key}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
