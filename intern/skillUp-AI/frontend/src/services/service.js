import axios from "axios";

const url = "http://localhost:3001/api/skillup";

const getAll=()=>{

return axios
  .get(url)
  .then((response) => {
    return response.data;
  })
  .catch((errorData) => {
    return errorData;
  });
}

const create=(userData)=>{
axios
  .post(url, userData)
  .then((response) => {
    response.data;
  })
  .catch((error) => {
    console.log("error", error);
  });
}

  export default {getAll, create};