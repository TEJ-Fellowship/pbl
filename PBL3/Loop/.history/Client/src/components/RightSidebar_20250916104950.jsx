import React from "react";

export default function RightSidebar({
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
}) {
  return (
    <div className="w-64 bg-gray-800 p-4 flex flex-col space-y-6">
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
            onChange={(e) => setBrushSize(e.target.value)}
            className="ml-2"
          />
        </label>
      </div>
    </div>
  );
}
