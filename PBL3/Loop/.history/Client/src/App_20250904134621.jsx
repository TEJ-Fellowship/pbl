import React from "react";
import { Lock, User } from "lucide-react"
import Auth
function App() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
      <div className="w-full max-w-sm p-6 bg-[#1a1a1a] rounded-2xl shadow-lg text-center">
        {/* Logo */}
        <div className="flex justify-center items-center w-12 h-12 bg-green-500 rounded-full mx-auto mb-4">
          <span className="text-white text-lg font-bold">✏️</span>
        </div>

        {/* Title */}
        <h2 className="text-white text-xl font-semibold mb-2">
          Doodle Together
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Join the creative canvas and draw with friends.
        </p>

        {/* Username */}
        <div className="relative mb-3">
          <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Username or Email"
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-[#0f0f0f] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Password */}
        <div className="relative mb-4">
          <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="password"
            placeholder="Password"
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-[#0f0f0f] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Buttons */}
        <button className="w-full py-2 mb-3 rounded-lg bg-green-500 hover:bg-green-600 text-black font-medium">
          Login
        </button>
        <button className="w-full py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#333] text-white font-medium">
          Signup
        </button>

        {/* Forgot password */}
        <p className="text-gray-500 text-xs mt-4 cursor-pointer hover:underline">
          Forgot Password?
        </p>
      </div>
    </div>
  );
}

export default App;
