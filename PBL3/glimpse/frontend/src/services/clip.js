import axios from "axios";

const baseUrl = "http://localhost:3001/api/clips";

const getAll = () => {
  // Get auth token
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Please login first");
  }

  return axios
    .get(baseUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((result) => result.data);
};
const deleteClip = (clipId) => {
  // Get auth token
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Please login first");
  }

  if (!clipId) {
    throw new Error("Clip ID is required");
  }

  return axios
    .delete(`${baseUrl}/${clipId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((result) => result.data);
};

const uploadFile = async (file) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Please login first");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(baseUrl, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

const generateMontage = async (month, year, musicId = null) => {
  console.log("generateMontage called with:", { month, year, musicId });

  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Please login first");
  }

  console.log("Token found, making API request...");

  const requestBody = { month, year };
  if (musicId) {
    requestBody.musicId = musicId;
  }

  const response = await axios.post(
    "http://localhost:3001/api/montage/generate",
    requestBody,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  console.log("API response:", response);
  return response.data;
};

const startRecording = (videoElementId = "preview", duration = 5000) => {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        // Set up video element if provided
        if (videoElementId) {
          const videoElement = document.getElementById(videoElementId);
          if (videoElement) {
            videoElement.srcObject = stream;
            videoElement.play();
          }
        }

        const recorder = new MediaRecorder(stream);
        let chunks = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());

          const blob = new Blob(chunks, { type: "video/mp4" });
          const file = new File([blob], "recorded.mp4", { type: "video/mp4" });
          const videoUrl = URL.createObjectURL(blob);

          resolve({ file, videoUrl, blob });
        };

        recorder.onerror = (error) => {
          stream.getTracks().forEach((track) => track.stop());
          reject(error);
        };

        recorder.start();

        setTimeout(() => {
          if (recorder.state === "recording") {
            recorder.stop();
          }
        }, duration);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

const addMusicToMontage = async (montageId, musicId) => {
  console.log("addMusicToMontage called with:", { montageId, musicId });

  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Please login first");
  }

  const response = await axios.post(
    `http://localhost:3001/api/montage/add-music/${montageId}`,
    { musicId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  console.log("Add music API response:", response);
  return response.data;
};

export default {
  getAll,
  deleteClip,
  uploadFile,
  startRecording,
  generateMontage,
  addMusicToMontage,
};
