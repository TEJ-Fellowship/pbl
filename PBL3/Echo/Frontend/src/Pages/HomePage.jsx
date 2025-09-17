import AddConfession from "../Components/Addconfession";
import Feed from "../Components/Feed";
import axios from "axios";
import { useState, useEffect } from "react";
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

  function handleLogout() {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1>Welcome to HomePage 🎉</h1>

      <AddConfession setClips={setClips} />
      <Feed setClips={setClips} clips={clips} />
      <button
        onClick={handleLogout}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg"
      >
        Logout
      </button>
    </div>
  );
};

export default HomePage;
