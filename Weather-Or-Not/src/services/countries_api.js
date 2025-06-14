import axios from "axios";

const baseUrl = "https://studies.cs.helsinki.fi/restcountries/api/";

export const getAllCountries = async () => {
  try {
    const response = await axios.get(`${baseUrl}/all`);
    return response.data;
  } catch (error) {
    throw error; //rethrow the error to be handled by the caller
  }
};

export const getCountryByName = async (searchItem) => {
  try {
    const response = await axios.get(`${baseUrl}/name/${searchItem}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
