// src/pages/Dashboard.jsx
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import ChatInterface from "../components/chat/ChatInterface.jsx";
import ChatHistory from "../components/chat/ChatHistory.jsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const [topic, setTopic] = useState("");
  console.log("selected topic ", topic);

  const { setIsAuthenticated, user } = useContext(AuthContext);
  console.log("log name ", user.fullName);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements - same as login */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-violet-400/10 to-fuchsia-400/10 animate-pulse"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-r from-yellow-400 to-red-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-blue-400 to-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 flex gap-x-7 p-6 h-screen overflow-hidden">
        {/* Chat History Sidebar */}
        <div className="w-1/4">
          <ChatHistory user={user} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col space-y-6">
          {/* Header with Logout */}
          <div className="flex justify-between items-center">
            <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-4 border border-slate-700/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400"></div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                SkillUp AI Dashboard
              </h1>
              <p className="text-slate-300 text-sm">
                Welcome back, {user.fullName}!
              </p>
            </div>
            <div>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </div>

          {/* Language Selection */}
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-slate-700/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400"></div>
            <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-violet-400/20 to-fuchsia-400/20 rounded-full blur-xl"></div>

            <label className="block text-lg font-medium text-slate-200 mb-3">
              Choose a language to study:
            </label>
            <div className="relative">
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400/50 transition-all duration-300 text-white hover:bg-slate-700/70 hover:border-slate-500/50"
              >
                <option value="">Select a language</option>
                <option value="JavaScript">JavaScript</option>
                <option value="React">React</option>
                <option value="Python">Python</option>
                <option value="HTML/CSS">HTML/CSS</option>
              </select>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/5 via-violet-400/5 to-fuchsia-400/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          {/* Chat Interface */}
          <ChatInterface topic={topic} user={user} />
        </div>
      </div>

      {/* Add custom keyframes for animations - same as login */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
