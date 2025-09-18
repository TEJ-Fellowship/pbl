import axios from "axios";

const baseUrl = "http://localhost:3001/api/clips";

const getAll = () => {
  return axios.get(baseUrl).then((result) => result.data);
};

const create = ({videoUrl, publicId, thumbnailurl}) => {
  return axios.post(baseUrl, {videoUrl, publicId, thumbnailurl});
};


export default { getAll, create };