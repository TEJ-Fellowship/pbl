import React, { useState, useEffect } from "react";
import { Link, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { FiSettings } from "react-icons/fi";
import Home from "../components/Home";
import MyPolls from "../components/MyPolls";
import CreatePoll from "../components/CreatePoll";
import PollResult from "../components/PollResult";
import AllPolls from "../components/AllPolls";
import axios from "axios";

function Dashboard() {
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState(null); 
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get("http://localhost:5000/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(res.data); 
        console.log("Logged in user", res.data);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, []);

  // Helper: check active route
  const isActive = (path) =>
    location.pathname === path
      ? "bg-red-600 text-white"
      : "hover:bg-red-600 hover:text-white";

  // Logout function
  function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="w-64 h-screen bg-white shadow-lg p-6 space-y-6 flex flex-col fixed left-0 top-0">
        <h1 className="text-2xl font-bold text-red-600">Spindle</h1>

        {/* Navigation */}
        <nav className="space-y-2 flex-1">
          <Link
            to="/dashboard/home"
            className={`block w-full text-left px-4 py-2 rounded-lg ${isActive(
              "/dashboard/home"
            )}`}
          >
            🏠 Home
          </Link>

          <Link
            to="/dashboard/mypolls"
            className={`block w-full text-left px-4 py-2 rounded-lg ${isActive(
              "/dashboard/mypolls"
            )}`}
          >
            📊 My Polls
          </Link>

          <Link
            to="/dashboard/createpolls"
            className={`block w-full text-left px-4 py-2 rounded-lg ${isActive(
              "/dashboard/createpolls"
            )}`}
          >
            ➕ Create Polls
          </Link>

          <Link
            to="/dashboard/allpolls"
            className={`block w-full text-left px-4 py-2 rounded-lg ${isActive(
              "/dashboard/allpolls"
            )}`}
          >
            🗳️ All Polls
          </Link>
        </nav>

        {/* Settings Button */}
        <div className="mt-auto relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-black text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition flex items-center justify-center"
            aria-label="Settings"
          >
            <FiSettings size={16} />
          </button>

          {showSettings && user && (
            <div className="absolute bottom-16 left-6 z-50 bg-white border border-gray-200 shadow-xl rounded-xl p-4 w-60 text-sm">
              <p className="text-gray-800">
                <span className="text-gray-600 opacity-70">Email: {user.email}</span>
              </p>
              <p className="text-gray-800 mt-1">
                <span className="text-gray-600 opacity-50">Username: {user.username}</span>
              </p>

              <button
                onClick={logout}
                className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64 p-6 bg-gray-100 overflow-y-auto min-h-screen">
        <Routes>
          <Route path="/" element={<Navigate to="home" />} />
          <Route path="home" element={<Home />} />
          <Route path="mypolls" element={<MyPolls />} />
          <Route path="createpolls" element={<CreatePoll />} />
          <Route path="allpolls" element={<AllPolls />} />
          <Route path="polls/:id/results" element={<PollResult />} />
        </Routes>
      </div>
    </div>
  );
}

export default Dashboard;
