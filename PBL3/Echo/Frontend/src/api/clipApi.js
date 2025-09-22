// src/api/clipApi.js
import axios from "axios";

const API_URL = "http://localhost:3001/api/clips";
const uploadClip = async (audioBlob, token, caption, roomId = null) => {
  // const token = localStorage.getItem("token");
  const formData = new FormData(); // a virtual form
  formData.append("audio", audioBlob, "recording.webm");
  if (caption) formData.append("caption", caption);
  if (roomId) formData.append("roomId", roomId);

  try {
    const res = await axios.post(API_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err) {
    console.log("Error:", err);
    throw err;
  }
};

export default uploadClip;
