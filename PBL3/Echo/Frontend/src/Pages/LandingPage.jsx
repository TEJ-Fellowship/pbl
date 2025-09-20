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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
            E
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
          Record voice clips, join rooms, and react in real-time — a safe place
          to speak up and be heard. Minimal. Fast. Echo-y.
        </p>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg"
          >
            Get Started
          </button>
        </div>

        {/* Echo graphic (glow + subtle waveform) */}
        <div className="relative mt-12 w-full max-w-lg h-44">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-56 h-56 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 rounded-full blur-3xl animate-pulse" />
          </div>

          <svg
            className="absolute inset-0 w-full h-full opacity-70"
            viewBox="0 0 600 160"
            preserveAspectRatio="none"
          >
            <path
              d="M0 80 C100 10, 200 150, 300 80 C400 10, 500 150, 600 80"
              stroke="url(#g1)"
              strokeWidth="6"
              fill="transparent"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </main>

      {/* Features */}
      <section className="py-12 bg-slate-900 text-center">
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
