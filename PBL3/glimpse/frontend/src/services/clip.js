import axios from "axios";

const baseUrl = "http://localhost:3002/api/clips";

const getAll = () => {
  return axios.get(baseUrl).then((result) => result.data);
};

const create = ({videoUrl, publicId}) => {
  return axios.post(baseUrl, {videoUrl, publicId});
};


export default { getAll, create };