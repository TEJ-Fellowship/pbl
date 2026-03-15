import React, { useContext } from "react";
import { ThemeContext } from "../ThemeContext";

function Streak({ streak }) {
  const { isDark } = useContext(ThemeContext);

  return (
    <div
      className={`h-[160px] w-[86%] flex flex-col items-center justify-center rounded-2xl mx-auto p-5 transition-colors duration-300
        ${isDark ? "bg-orange-800" : "bg-orange-500"}`}
    >
      <div className="flex items-center gap-4">
        <img
          src={isDark ? "/streakwhite.png" : "/streakwhite.png"}
          alt="firestreak"
          className="h-7 w-7"
        />
        <h1 className="font-bold text-lg text-white">Current Streak</h1>
      </div>

      <button
        className={`px-4 py-1 rounded-md font-bold mt-2 transition-colors duration-300
          ${isDark ? "bg-white-900 text-white-400" : "bg-white text-orange-500"}`}
      >
        {streak}
      </button>

      <p className="text-white mt-2">days in a row</p>
    </div>
  );
}

export default Streak;
