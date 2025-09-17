import AddConfession from "../Components/Addconfession";
import Feed from "../Components/Feed";
import axios from "axios";
import { useState, useEffect } from "react";
import Navbar from "../Components/Navbar";
const HomePage = ({ setIsLoggedIn }) => {
  const [clips, setClips] = useState([]);

  useEffect(() => {
    const fetchClips = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("http://localhost:3001/api/clips", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClips(res.data);
      } catch (err) {
        console.error("Failed to fetch clips:", err);
      }
    };

    fetchClips();
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <Navbar setIsLoggedIn={setIsLoggedIn} />
      <Recorder onSave={(clip) => setClips((prev) => [clip, ...prev])} />

      <AddConfession setClips={setClips} />
      <Feed setClips={setClips} clips={clips} />
    </div>
  );
};

export default HomePage;
