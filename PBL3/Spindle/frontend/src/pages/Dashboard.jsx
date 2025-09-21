import React, { useState, useEffect } from "react";
import { Link, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { FiSettings } from "react-icons/fi";
import { FiArrowRight } from "react-icons/fi";
import { AiOutlinePlus, AiFillPlusCircle } from "react-icons/ai";
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
      ? "bg-rose-600 text-white"
      : "hover:bg-rose-600 hover:text-white";

  // Logout function
  function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="w-64 h-screen bg-white shadow-lg p-6 space-y-6 flex flex-col fixed left-0 top-0">
        <h1 className="text-2xl font-bold text-red-600">QuickPick</h1>

        {/* Navigation */}
        <nav className="space-y-2 flex-1">
          <Link
            to="/dashboard/mypolls"
            className={`group relative flex items-center justify-between w-full text-left px-4 py-3 rounded transition duration-200 transform font-bold ${isActive(
              "/dashboard/mypolls"
            )}`}
          >
            <div className="flex items-center gap-2">
              🏠 <span>My Polls</span>
            </div>
            <FiArrowRight className="inline-block w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>

          <Link
            to="/dashboard/createpolls"
            className={`group relative flex items-center justify-between w-full text-left px-4 py-3 rounded transition duration-200 transform font-bold ${isActive(
              "/dashboard/createpolls"
            )}`}
          >
            <div className="flex items-center gap-2">
              <AiFillPlusCircle className="w-6 h-6" />
              <span>Create Polls</span>
            </div>
            <FiArrowRight className="inline-block w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>

          <Link
            to="/dashboard/allpolls"
            className={`group relative flex items-center justify-between w-full text-left px-4 py-3 rounded transition duration-200 transform font-bold ${isActive(
              "/dashboard/allpolls"
            )}`}
          >
            <div className="flex items-center gap-2">
              🗳️ <span>All Polls</span>
            </div>
            <FiArrowRight className="inline-block w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
              <p><span className="text-gray-600 opacity-90">Login User:</span></p>
              <p className="text-gray-800">
                <span className="text-gray-600 opacity-70">Email: {user.email}</span>
              </p>
              <p className="text-gray-800 mt-1">
                <span className="text-gray-600 opacity-50">
                  Username: {user?.username}
                </span>
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
