import axios from "axios";
const url = "http://localhost:3001/"; // correct URL

const getAll = () => {
  return axios
    .get(url)
    .then((response) => response.data)
    .catch((error) => {
      // return error info so component can handle
      return { error: error.response?.data || error.message };
    });
};

const create = (userDefineUrl, userData) => {
  return axios
    .post(userDefineUrl, userData)
    .then((response) => response.data) // return response to caller
    .catch((error) => {
      return { error: error.response?.data || error.message }; // return error
    });
};

export default { getAll, create };
