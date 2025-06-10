import { useState, useEffect } from "react";
import "./styles/App.css";
import  SearchBar  from "./components/SearchBar";

function App() {
  const [searchCity, setSearchCity] = useState("");


  return (
   <>
   <div className="w-[800px] rounded-2xl shadow-2xl bg-white/30 backdrop-blur-md overflow-hidden">
        <div className="relative h-[450px]">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
            alt="Weather"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-6 left-8 text-white">
            <h1 className="text-3xl font-light">
              Buch<span className="font-bold">arest</span>, RO
            </h1>
          </div>
          <div className="absolute top-6 right-8 text-white flex flex-col items-end">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3"
                />
                <circle
                  cx={12}
                  cy={12}
                  r={10}
                  stroke="currentColor"
                  strokeWidth={2}
                  fill="none"
                />
              </svg>
              <span className="text-xs">FLORIDA, USA</span>
            </div>
            <span className="text-lg font-semibold">20:15 pm</span>
          </div>
          {/* Search Field */}
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-3/4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for a city..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full px-4 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white placeholder-white/70 border border-white/30 focus:outline-none focus:border-white/50"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-white/80">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
          <button className="absolute bottom-16 right-8 bg-green-400 text-white px-4 py-2 rounded-full shadow hover:bg-green-500 transition">
            LATEST LOCATIONS
          </button>
          <div className="absolute bottom-0 left-0 w-full flex justify-around text-white text-sm">
            <span className="py-2 border-b-2 border-yellow-400">WEATHER</span>
            <span className="py-2 opacity-60">NEWS &amp; EVENTS</span>
            <span className="py-2 opacity-60">GALLERY (30)</span>
          </div>
        </div>
        {/* Bottom Section */}
        <div className="bg-white/80 px-8 py-6 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 flex flex-col items-center">
            <div className="flex items-center gap-4">
              <span className="text-6xl font-bold text-gray-800">82°</span>
              <div>
                <svg
                  className="w-12 h-12 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M3 16s1-4 7-4 7 4 7 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 20h14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 16v4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 16v4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="block text-gray-500 text-xs">4mph | 67°</span>
              </div>
            </div>
            <span className="text-gray-600 mt-2">
              MONDAY 27<sup>th</sup>
            </span>
          </div>
          <div className="flex-1 grid grid-cols-6 gap-4 text-center">
            <div>
              <span className="block text-gray-500">TUE</span>
              <span className="block text-2xl">60°</span>
              <span className="block text-gray-400">☁️</span>
            </div>
            <div>
              <span className="block text-gray-500">WED</span>
              <span className="block text-2xl">72°</span>
              <span className="block text-yellow-400">☀️</span>
            </div>
            <div>
              <span className="block text-gray-500">THU</span>
              <span className="block text-2xl">63°</span>
              <span className="block text-gray-400">☁️</span>
            </div>
            <div>
              <span className="block text-gray-500">FRI</span>
              <span className="block text-2xl">65°</span>
              <span className="block text-blue-400">🌧️</span>
            </div>
            <div>
              <span className="block text-gray-500">SAT</span>
              <span className="block text-2xl">18°</span>
              <span className="block text-blue-200">❄️</span>
            </div>
            <div>
              <span className="block text-gray-500">SUN</span>
              <span className="block text-2xl">69°</span>
              <span className="block text-gray-400">☁️</span>
            </div>
          </div>
        </div>
      </div>
   </>
  );
}

export default App;
