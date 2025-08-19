import { useState } from "react";
import GenreSelector from "./GenreSelector";
import Home from "./Home";
import MyMovies from "./MyMovies";

import "./index.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#141414] text-white">
        <nav className="bg-[#141414] p-4 sm:px-8 sm:py-4 shadow-lg border-b border-[#333333] sticky top-0 z-50 flex justify-between items-center">
          <div
            className="bg-gradient-to-r from-[#FF0000] to-[#FF5555] bg-clip-text text-transparent font-extrabold text-2xl tracking-wider drop-shadow-xl select-none cursor-pointer"
            onClick={() => (window.location.href = "/")}
          >
            Filmoniq
          </div>

          <ul className="flex gap-6 text-white">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? "font-bold underline decoration-[#E50000]"
                    : "hover:text-[#E50000] transition-colors text-bold"
                }
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/mymovies"
                className={({ isActive }) =>
                  isActive
                    ? "font-bold underline decoration-[#E50000]"
                    : "hover:text-[#E50000] transition-colors"
                }
              >
                MyMovies
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mymovies" element={<MyMovies />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
