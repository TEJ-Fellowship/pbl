// src/services/service.js

import axios from "axios";
const url = "http://localhost:3001"; // correct URL
const validateTokenURL = import.meta.env.VITE_VALIDATE_TOKEN_URL;

const getAll = () => {
  return axios
    .get(url)
    .then((response) => response.data)
    .catch((error) => {
      // return error info so component can handle
      return { error: error.response?.data || error.message };
    });
};

const create = async (userDefineUrl, userData) => {
  try{
    const response = await axios.post(userDefineUrl, userData);
    return response.data;
  }catch(error){
    throw new Error (error.response?.data?.message || error?.message)
  }
  // return axios
  //   .post(userDefineUrl, userData)
  //   .then((response) => {
  //     return response.data;
  //   }) // return response to caller
  //   .catch((error) => {
  //     return { error: error.response?.data || error.message }; // return error
  //   });
};

const validateToken = (token) => {
  return axios
    .get(validateTokenURL, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      throw error;
    });
};
export default { getAll, create, validateToken };
