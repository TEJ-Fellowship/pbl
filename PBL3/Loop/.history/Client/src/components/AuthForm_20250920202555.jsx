import React, { useState } from "react";
import { Lock, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const BACKEND_URL = "http://localhost:3001"; // Your Express server

export default function AuthForm({ mode }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();

  // Form state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const endpoint = isLogin
        ? `${BACKEND_URL}/api/auth/login`
        : `${BACKEND_URL}/api/auth/signup`;

      const body = isLogin
        ? { email, password }
        : { username, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        return;
      }

      // Save token
      localStorage.setItem("token", data.token);

      // Redirect
      navigate("/home");
    } catch (err) {
      setError("Server error. Please try again later.");
      console.error(err);
    }
  };

  return (
    <motion.div
  className="flex items-center justify-center min-h-screen bg-[#ffe9e3]"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.5 }}
>
    <div className="flex items-center justify-center min-h-screen bg-[#ffe9e3]">
      <div className="w-full max-w-sm p-6 bg-[#1a1a1a] border-0 rounded-2xl shadow-lg">
        <div className="flex justify-center items-center w-12 h-12 bg-green-500 rounded-full mb-4 mx-auto">
          <span className="text-white text-lg font-bold">✏️</span>
        </div>

        <h2 className="text-white text-xl font-semibold text-center mb-2">
          {isLogin ? "Login to Doodle Together" : "Create an Account"}
        </h2>
        <p className="text-gray-400 text-sm mb-6 text-center">
          {isLogin
            ? "Enter your credentials to continue."
            : "Join the creative canvas and draw with friends."}
        </p>

        {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="w-full mb-3 relative">
              <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-[#0f0f0f] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          <div className="w-full mb-3 relative">
            <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-[#0f0f0f] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="w-full mb-4 relative">
            <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-[#0f0f0f] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-green-500"
            />
          </div>

          {!isLogin && (
            <div className="relative mb-4">
              <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-[#0f0f0f] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 mb-3 rounded-lg bg-green-500 hover:bg-green-600 text-black font-medium"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-4 text-center">
          {isLogin ? (
            <>
              <p className="text-gray-500 text-sm mt-2 cursor-pointer hover:underline">
                Forgot Password?
              </p>
              <span>
                Don't have an account?{" "}
                <Link to="/signup" className="text-green-400 hover:underline">
                  Sign Up
                </Link>
              </span>
            </>
          ) : (
            <>
              <span>
                Already have an account?{" "}
                <Link to="/login" className="text-green-400 hover:underline">
                  Login
                </Link>
              </span>
            </>
          )}
        </p>
      </div>
    </div>zz
    </motion.div>
  );
}
