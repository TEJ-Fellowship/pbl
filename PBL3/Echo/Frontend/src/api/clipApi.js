// api/clipApi.js
import axios from "axios";

const API_URL = "http://localhost:5000/api/clips";
const uploadClip = async (audioBlob) => {
  const formData = new FormData(); // a virtual form
  formData.append("audio", audioBlob, "recording.webm");
  try {
    const res = await axios.post(API_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    console.log("Error:", err);
    throw err;
  }
};

export default uploadClip;
