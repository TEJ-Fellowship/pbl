import React, { useState, useEffect } from "react";
import Home from "../components/Home";
import MyPolls from "../components/MyPolls";
import CreatePoll from "../components/CreatePoll";
import AllPoll from "../components/AllPolls";
import { useNavigate } from "react-router-dom";
import { FiSettings } from "react-icons/fi";

function Dashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("home");
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState(null);

  function logout() {
    const confirmLogout = window.confirm("Do you want to logout?");
    if (confirmLogout) {
      localStorage.removeItem("token");
      window.alert("Logged out successfully!");
      navigate("/login");
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:5000/api/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="w-64 h-screen bg-white shadow-lg p-6 space-y-6 flex flex-col fixed left-0 top-0">
        <h1 className="text-2xl font-bold text-red-600">Spindle</h1>

        {/* Navigation */}
        <nav className="space-y-2 flex-1">
          <button
            onClick={() => setActiveSection("home")}
            className={`w-full text-left px-4 py-2 rounded-lg ${activeSection === "home"
              ? "bg-red-600 text-white"
              : "hover:bg-red-600 hover:text-white"
              }`}
          >
            🏠 Home
          </button>
          <button
            onClick={() => setActiveSection("mypolls")}
            className={`w-full text-left px-4 py-2 rounded-lg ${activeSection === "mypolls"
              ? "bg-red-600 text-white"
              : "hover:bg-red-600 hover:text-white"
              }`}
          >
            📊 My Polls
          </button>
          <button
            onClick={() => setActiveSection("createpolls")}
            className={`w-full text-left px-4 py-2 rounded-lg ${activeSection === "createpolls"
              ? "bg-red-600 text-white"
              : "hover:bg-red-600 hover:text-white"
              }`}
          >
            ➕ Create Polls
          </button>
          <button
            onClick={() => setActiveSection("allpolls")}
            className={`w-full text-left px-4 py-2 rounded-lg ${activeSection === "allpolls"
              ? "bg-red-600 text-white"
              : "hover:bg-red-600 hover:text-white"
              }`}
          >
            🗳️ All Polls
          </button>
        </nav>
        <div className="mt-auto">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-black text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition flex items-center justify-center"
            aria-label="Settings"
          >
            <FiSettings size={16} />
          </button>

          {showSettings && (
            <>
              <div className="absolute bottom-16 left-6 z-50 bg-white border border-gray-200 shadow-xl rounded-xl p-4 w-60 text-sm">
                <p className="text-gray-800">
                  <span className="text-gray-600 opacaity-80">Email: {user?.email}</span>
                </p>
                <p className="text-gray-800 mt-1">
                  <span className="text-gray-600 opacity-70">Username: {user?.username}</span>
                </p>

                <button
                  onClick={logout}
                  className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64 p-6 bg-gray-100 overflow-y-auto min-h-screen">
        {activeSection === "home" && <Home />}
        {activeSection === "mypolls" && <MyPolls />}
        {activeSection === "createpolls" && <CreatePoll />}
        {activeSection === "allpolls" && <AllPoll/>}
      </div>
    </div>
  );
}

export default Dashboard;
