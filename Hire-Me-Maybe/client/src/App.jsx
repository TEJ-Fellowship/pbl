import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ResumeUpload from "./components/resume/ResumeUpload";

import Signup from "./components/Signup";
import Login from "./components/Login";

const App = () => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("loggedUser")) || null
  );
  const [view, setView] = useState("signup");

  const handleSignup = () => {
    toast.success("Signup successful! Please log in.");
    setView("login");
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("loggedUser", JSON.stringify(userData));
    toast.success(`Welcome back, ${userData.username}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedUser");
    setUser(null);
    setView("login");
    toast.info("You have been logged out.");
  };

  if (user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Welcome back, {user.username}!
          </h1>
          <p className="text-gray-600 mb-6">Ready to build your perfect resume?</p>
          <button
            onClick={handleLogout}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Logout
          </button>
        </div>
        <ToastContainer position="top-center" autoClose={3000} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row">

          {/* Left Panel - Descriptive Text */}
          <div className="md:w-1/2 bg-gradient-to-br from-indigo-600 to-blue-500 p-8 md:p-12 flex flex-col justify-center text-white">
            <div className="mb-8">
              {/* AI Icon */}
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>

              <h1 className="text-4xl font-bold mb-4">
                AI Resume Builder
              </h1>
              <p className="text-xl text-indigo-100 mb-6">
                Your AI-powered resume builder helps you craft the perfect resume in minutes!
              </p>
              <p className="text-indigo-200 leading-relaxed">
                Create professional resumes tailored for your dream job. Our intelligent system analyzes job descriptions and optimizes your resume for maximum impact.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
                <span className="text-indigo-100">AI-powered content suggestions</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
                <span className="text-indigo-100">Professional templates</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
                <span className="text-indigo-100">ATS-friendly formatting</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Authentication Form */}
          <div className="md:w-1/2 p-8 md:p-12">

            {/* Tab Navigation */}
            <div className="flex mb-8 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView("signup")}
                className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${view === "signup"
                  ? "bg-white text-indigo-600 shadow-sm font-semibold"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => setView("login")}
                className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${view === "login"
                  ? "bg-white text-indigo-600 shadow-sm font-semibold"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Login
              </button>
            </div>

            {/* Form Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {view === "signup" ? "Create an account" : "Welcome back"}
              </h2>
              <p className="text-gray-600">
                {view === "signup"
                  ? "Your student account is your portal to all things Fullstack: workshops, help desk, career resources, and more!"
                  : "Sign in to continue building your resume"
                }
              </p>
            </div>

            {/* Form Content */}
            <div className="space-y-6">
              {view === "signup" ? (
                <Signup onSignup={handleSignup} />
              ) : (
                <Login onLogin={handleLogin} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast notifications container */}
      <ToastContainer position="top-center" autoClose={3000} />
      <ResumeUpload />
    </div>
  );
};

export default App;
