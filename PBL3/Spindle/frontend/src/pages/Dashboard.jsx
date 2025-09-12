import React from "react";
import { Link, Routes, Route, Navigate } from "react-router-dom";
import Home from "../components/Home";
import MyPolls from "../components/MyPolls";
import CreatePoll from "../components/CreatePoll";
import PollResult from "../components/PollResult";
function Dashboard() {
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
          <Link
            to="/dashboard/home"
            className="block w-full text-left px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white"
          >
            🏠 Home
          </Link>

          <Link
            to="/dashboard/mypolls"
            className="block w-full text-left px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white"
          >
            📊 My Polls
          </Link>

          <Link
            to="/dashboard/createpolls"
            className="block w-full text-left px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white"
          >
            ➕ Create Polls
          </Link>
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
      <Routes>

      <Route path="/" element={<Navigate to="home"/>} />



      <Route path="home" element={<Home/>}/>

      <Route path="mypolls" element={<MyPolls/>}/>
      <Route path="polls/:id/results" element={<PollResult/>}/>


      <Route path="createpolls" element={<CreatePoll/>}/>

      </Routes>

      </div>
     
    </div>
  );
}

export default Dashboard;
