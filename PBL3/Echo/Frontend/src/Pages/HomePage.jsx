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

  const handleRecorderSave = (clip) => {
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
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar setIsLoggedIn={setIsLoggedIn} />
      <main className="max-w-3xl mx-auto p-6 flex flex-col gap-8">
        <Recorder onSave={handleRecorderSave} />

        <Feed clips={clips} setClips={setClips} />
      </main>
    </div>
  );
};

export default HomePage;
