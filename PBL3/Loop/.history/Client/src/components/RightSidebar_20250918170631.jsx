import React, { useEffect, useState, useRef } from "react";

export default function RightSidebar({
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  setBackgroundColor,
}) {
  const backgroundOptions = ["#ffffff", "#bbf7d0", "#fbcfe8", "#fef08a", "#bfdbfe"]; 
  const totalTime = 30; // seconds per turn
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [isRunning, setIsRunning] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (audioRef.current) {
        audioRef.current.play(); // play sound when timer ends
      }
      alert("⏰ Time is up!");
    }

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const progress = (timeLeft / totalTime) * 100;

  const handleStart = () => {
    setTimeLeft(totalTime);
    setIsRunning(true);
  };

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
          {backgroundOptions.map((color) => (
            <div
              key={color}
              className="h-16 rounded-lg cursor-pointer bord"
              style={{ backgroundColor: color }}
              onClick={() => setBackgroundColor(color)}
            ></div>
          ))}
        </div>

      {/* Custom background color picker */}
  <label className="flex items-center space-x-2">
    <span >Custom:</span>
    <input
      type="color"
      onChange={(e) => setBackgroundColor(e.target.value)}
      className="mt-5 w-10 h-10 rounded cursor-pointer border border-gray-600"
    />
  </label>

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
        <h2 className="text-lg font-semibold mb-2 flex justify-between items-center">
          Turn Timer
          <button
            onClick={handleStart}
            className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-400 rounded-lg"
          >
            {isRunning ? "Restart" : "Start"}
          </button>
        </h2>
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-green-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-right text-sm text-gray-300 mt-1">
          {isRunning ? `${timeLeft}s left` : "Not running"}
        </p>
        {/* Hidden audio element */}
        <audio ref={audioRef} src="/alert-sound.mp3" preload="auto"></audio>
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
