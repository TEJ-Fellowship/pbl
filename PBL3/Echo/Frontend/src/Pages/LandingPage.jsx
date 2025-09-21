// src/Pages/LandingPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-10 h-10 rounded-full  flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 transition-transform duration-300 w-14 h-14">
            <img src="/logo.svg" alt="logo" />
          </div>
          <div className="text-lg font-semibold tracking-wide">Echo</div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Echo your voice. <br /> Share sound. Connect instantly.
        </h1>

        <p className="mt-4 text-lg text-gray-300 max-w-xl">
          Record voice clips, join rooms, and react in real-time. A safe place
          to speak up and be heard. Minimal. Fast. Echo-y.
        </p>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg"
          >
            Get Started
          </button>
        </div>
      </main>

      {/* Features */}
      <section className="mt-5 py-12 bg-slate-900 text-center">
        <h2 className="text-2xl font-bold mb-8">Why Echo?</h2>
        <div className="grid gap-6 md:grid-cols-3 px-6 max-w-5xl mx-auto">
          <div className="p-6 rounded-xl bg-slate-800">
            <div className="text-2xl">🎙️</div>
            <h3 className="font-semibold mt-2">Record instantly</h3>
            <p className="text-sm text-gray-400 mt-1">
              Capture thoughts, ideas, or confessions in seconds.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-slate-800">
            <div className="text-2xl">🔊</div>
            <h3 className="font-semibold mt-2">Rooms to share</h3>
            <p className="text-sm text-gray-400 mt-1">
              Create private rooms or join public ones — share with ease.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-slate-800">
            <div className="text-2xl">⚡</div>
            <h3 className="font-semibold mt-2">React in real-time</h3>
            <p className="text-sm text-gray-400 mt-1">
              Live reactions and instant updates across your community.
            </p>
          </div>
        </div>
      </section>

      <footer className="py-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Echo — Built with vibe by Bijay and Swikar
      </footer>
    </div>
  );
}
