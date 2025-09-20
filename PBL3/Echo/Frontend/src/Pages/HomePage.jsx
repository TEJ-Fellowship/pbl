// frontend/Pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import Recorder from "../Components/Recorder";
import Feed from "../Components/Feed";
import Navbar from "../Components/Navbar";
import axios from "axios";

const HomePage = ({ setIsLoggedIn }) => {
  const [clips, setClips] = useState([]);

  let currentUserId = null;
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      currentUserId = payload.id || payload.userId || null;
    } catch (err) {
      console.warn("Failed to decode token in HomePage", err);
    }
  }

  useEffect(() => {
    const fetchClips = async () => {
      try {
        const tokenLocal = localStorage.getItem("token");
        if (!tokenLocal) return;
        const res = await axios.get("http://localhost:3001/api/clips", {
          headers: { Authorization: `Bearer ${tokenLocal}` },
        });

        // server returns aggregated reactions and userId — compute isOwner locally
        const normalized = res.data.map((c) => {
          const ownerId = c.userId ? String(c.userId) : null;
          return { ...c, isOwner: ownerId === String(currentUserId) };
        });

        setClips(normalized);
      } catch (err) {
        console.error("Failed to fetch clips:", err);
      }
    };

    fetchClips();
  }, []);

  // Recorder onSave for feed receives a full clip object
  const handleRecorderSave = (clip) => {
    // compute owner locally and dedupe by _id
    const ownerId = clip.userId ? String(clip.userId) : null;
    const clipWithOwner = {
      ...clip,
      isOwner: ownerId === String(currentUserId),
    };

    setClips((prev) => {
      if (prev.some((c) => c._id === clipWithOwner._id)) return prev;
      return [clipWithOwner, ...prev];
    });
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <Navbar setIsLoggedIn={setIsLoggedIn} />
      <Recorder onSave={handleRecorderSave} /> {/* NO roomId prop here */}
      <Feed clips={clips} setClips={setClips} />
    </div>
  );
};

export default HomePage;
