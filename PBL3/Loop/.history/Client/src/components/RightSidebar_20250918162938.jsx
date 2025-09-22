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
      {/* --- other sections unchanged --- */}

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
