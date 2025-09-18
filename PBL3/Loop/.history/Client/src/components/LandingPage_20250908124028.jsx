import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen bg-[#ffe9e3]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h1 className="text-4xl font-bold mb-6 text-[#1a1a1a]">Welcome to Doodle Together</h1>
      <p className="text-gray-700 mb-8 text-center">
        Join our creative canvas and draw with friends!
      </p>
      <div className="flex gap-4">
        <Link
          to="/login"
          className="px-6 py-3 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-600"
        >
          Login
        </Link>
        <Link
          to="/signup"
          className="px-6 py-3 rounded-lg bg-black text-green-400 border border-green-400 hover:bg-green-700 hover:text-white"
        >
          Sign Up
        </Link>
      </div>
    </motion.div>
  );
}
