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
    return {error: error.response?.data?.message || error?.message};
  }
};

const validateToken = (token) => {
  return axios
    .get(validateTokenURL, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => {
      console.log(response.data.fullName,"this is fullname from services")
      return response.data;
    })
    .catch((error) => {
      throw error;
    });
};
export default { getAll, create, validateToken };
