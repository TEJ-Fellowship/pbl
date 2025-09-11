import Recorder from "../Components/Recorder";
import Feed from "../Components/Feed";
import { useState, useEffect } from "react";
const HomePage = ({ setIsLoggedIn }) => {
  const [clips, setClips] = useState([]);
  function handleLogout() {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1>Welcome to HomePage 🎉</h1>

      <Recorder setClips={setClips} />
      <Feed clips={clips} />
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
