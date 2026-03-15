import React from "react"
import { Lock, User} from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthForm({ mode }) {
  const isLogin = mode === "login";
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#ffe9e3]">
        <div className="w-full max-w-sm p-6 bg-[#1a1a1a] border-0 rounded-2xl shadow-lg">
            {/* Logo/Icon */}
            <div className="flex justify-center items-center w-12 h-12 bg-green-500 rounded-full mb-4 mx-auto">
          <span className="text-white text-lg font-bold">✏️</span>
        </div>
         {/* Title */}
        <h2 className="text-white text-xl font-semibold text-center mb-2">
          {isLogin ? "Login to Doodle Together" : "Create an Account"}
        </h2>
        <p className="text-gray-400 text-sm mb-6 text-center">
          {isLogin
           ? "Enter your credentials to continue."
           : "Join the creative canvas and draw with friends."
          }
        </p>
        {/* Username/Email */}
        <div className="w-full mb-3 relative">
          <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Username or Email"
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-[#0f0f0f] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-green-500"
          />
        </div>
        {/* Password */}
        <div className="w-full mb-4 relative">
          <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="password"
            placeholder="Password"
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-[#0f0f0f] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-green-500"
          />
        </div>
        {/* Confirm Password (Signup only) */}
        {!isLogin && (
          <div className="relative mb-4">
            <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-[#0f0f0f] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-green-500"
            />
          </div>
        )}
        {/* Buttons */}
        <button className="w-full py-2 mb-3 rounded-lg bg-green-500 hover:bg-green-600 text-black font-medium">
          {isLogin ? "Login" : "Sign Up"}
        </button>

        {/* Toggle link */}
        <p className="text-gray-400 text-sm mt-4">
          {isLogin ? (
            <>
            {/* Forgot password */}
            <p className="text-gray-500 text-sm mt-4 cursor-pointer hover:underline text-center">
            Forgot Password?
            </p>
            <p className="text-center">
              Don't have an account?{" "}
            <Link to="/signup" className="text-green-400 hover:underline">
            Sign Up
            </Link>
            </p>
            
            </>
          ) : (
            <>
            <p className>
              Already have an account?{" "}
            <Link to="/login" className="text-green-400 hover:underline">
            Login
            </Link>
            </p>
            </>
          )}
        </p>

        
        </div>
        </div>
    )
}