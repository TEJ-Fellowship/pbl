import React from "react";
import { useContext } from "react";
import { ThemeContext } from "../ThemeContext";
function Homepage() {
  return (
    <div className="bg-[#FFF4F3] flex items-center justify-center p-6"  style={{ height: "calc(100vh - 64px)" }}>
     <div className="max-w-3xl w-full bg-white rounded-3xl shadow-lg border border-blue-400 flex flex-col md:flex-row overflow-hidden" style={{ minHeight: '500px' }}>
        <div className="flex flex-col p-8 md:w-2/3">
          <h1 className="text-2xl font-semibold mb-4">Welcome to Nirvana!</h1>
          <p className="mb-4">
            What you can do with Nirvana:
          </p>
          <ul className="list-disc list-inside mb-6 space-y-1 text-gray-700">
            <li>Track your meditation sessions easily</li>
            <li>Monitor your progress over time</li>
            <li>Maintain streaks to build a daily habit</li>
            <li>Enjoy soothing, personalized music to enhance your experience</li>
          </ul>
          <a href="/login"> <button className="bg-blue-400 text-white font-semibold px-6 py-2 rounded-3xl hover:bg-blue-500 w-max">
            Login
          </button></a>
         
          <p className="text-xs text-gray-600 mt-6 italic max-w-xs">
            “Your mental health matters. Nirvana is completely free — because peace of mind should be accessible to everyone.”
          </p>
          <p className="mt-2 text-sm font-semibold text-right">- Nirvana Team</p>
        </div>
        <div className="md:w-1/3 hidden md:block">
          <img
            src='/girl.png'
            alt="Meditation illustration"
            className="object-contain h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}

export default Homepage;
