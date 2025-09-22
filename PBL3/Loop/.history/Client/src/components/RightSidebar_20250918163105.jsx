import React, { useEffect, useState } from "react";

export default function RightSidebar({
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
}) {
  const [timeLeft, setTimeLeft] = useState(30); // total turn time in seconds
  const totalTime = 30;

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer); // cleanup
  }, [timeLeft]);

  const progress = (timeLeft / totalTime) * 100;

  return (
    <div className="w-72 bg-gray-800 p-4 flex flex-col space-y-6">
      {/* Style Section */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Stylize</h2>
        <div className="flex space-x-2">
          {["Default", "Pixel", "Anime"].map((style) => (
            <button
              key={style}
              className="px-3 py-1 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Background Section */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Background</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-16 bg-green-200 rounded-lg"></div>
          <div className="h-16 bg-pink-200 rounded-lg"></div>
          <div className="h-16 bg-yellow-200 rounded-lg"></div>
          <div className="h-16 bg-blue-200 rounded-lg"></div>
        </div>
      </div>

      {/* Participants */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Participants</h2>
        <div className="flex -space-x-3">
          <img
            src="https://randomuser.me/api/portraits/men/32.jpg"
            alt="user"
            className="w-10 h-10 rounded-full border-2 border-gray-900"
          />
          <img
            src="https://randomuser.me/api/portraits/women/44.jpg"
            alt="user"
            className="w-10 h-10 rounded-full border-2 border-gray-900"
          />
          <img
            src="https://randomuser.me/api/portraits/men/76.jpg"
            alt="user"
            className="w-10 h-10 rounded-full border-2 border-gray-900"
          />
        </div>

        {/* Current Turn */}
        <div className="mt-4 p-3 bg-gray-700 rounded-lg flex items-center space-x-3">
          <img
            src="https://randomuser.me/api/portraits/men/32.jpg"
            alt="turn-user"
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="font-medium">Liam Carter</p>
            <p className="text-sm text-gray-300">Current Turn</p>
          </div>
        </div>
      </div>

      {/* Turn Timer */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Turn Timer</h2>
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-green-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-right text-sm text-gray-300 mt-1">{timeLeft}s left</p>
      </div>

      {/* Brush Controls */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Brush Settings</h2>
        <label className="block mb-2">
          Color:
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="ml-2"
          />
        </label>

        <label className="block">
          Size:
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="ml-2"
          />
        </label>
      </div>
    </div>
  );
}
