
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "../utils/axios";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return;
    }
    try {
      setLoadingUser(true);
      const { data } = await axios.get("/userRoutes/me");
      setUser(data);
    } catch (err) {
      console.error("Failed to fetch user:", err?.response?.data || err.message);
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const toggleProfile = async () => {
    setShowProfile((prev) => !prev);
    if (!user) await fetchUser();
  };

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout");
      localStorage.removeItem("token");
      setUser(null);
      setShowProfile(false);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err?.response?.data || err.message);
      alert("Failed to log out. Try again.");
    }
  };

  // const copyToClipboard = async (text) => {
  //   if (!text) return false;
  //   if (navigator.clipboard?.writeText) {
  //     await navigator.clipboard.writeText(text);
  //     return true;
  //   }
  //   try {
  //     const ta = document.createElement("textarea");
  //     ta.value = text;
  //     ta.setAttribute("readonly", "");
  //     ta.style.position = "absolute";
  //     ta.style.left = "-9999px";
  //     document.body.appendChild(ta);
  //     ta.select();
  //     document.execCommand("copy");
  //     document.body.removeChild(ta);
  //     return true;
  //   } catch (e) {
  //     console.error("Fallback copy failed", e);
  //     return false;
  //   }
  // };

  // const handleInvite = async () => {
  //   if (!currentRoomCode) {
  //     alert("No room selected to invite!");
  //     return;
  //   }
  //   try {
  //     const ok = await copyToClipboard(currentRoomCode);
  //     if (ok) alert(`Room code "${currentRoomCode}" copied! 📋`);
  //     else alert("Couldn't copy automatically. Please copy manually: " + currentRoomCode);
  //   } catch (err) {
  //     console.error(err);
  //     alert("Error copying room code. Open console for details.");
  //   }
  // };

  return (
    <div className="w-full bg-gray-800 text-white flex items-center px-6 py-3 shadow-md relative">
      <h1 className="text-xl font-bold absolute left-6">My App</h1>

      <div className="flex space-x-6 mx-auto">
        <Link to="/home" className="hover:text-yellow-300">Home</Link>
        <Link to="/gallery" className="hover:text-yellow-300">Gallery</Link>
        <Link to="/my-room" className="hover:text-yellow-300">My Room</Link>
      </div>

      <div className="flex flex-row gap-3 relative">
        {/* {currentRoomCode && (
          <button
            onClick={handleInvite}
            className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg"
          >
            Invite
          </button>
        )} */}

        <div className="relative">
          <button
            onClick={toggleProfile}
            className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg"
          >
            Profile
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-white text-black rounded-lg shadow-lg p-4 z-50">
              {loadingUser ? (
                <p>Loading...</p>
              ) : user ? (
                <>
                  <p><span className="font-bold">Username:</span> {user.username}</p>
                  <p><span className="font-bold">Email:</span> {user.email}</p>
                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-400 hover:bg-red-300 px-4 py-2 rounded-lg"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <p className="text-sm">
                  Not logged in. <Link to="/login" className="text-blue-600">Login</Link>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
