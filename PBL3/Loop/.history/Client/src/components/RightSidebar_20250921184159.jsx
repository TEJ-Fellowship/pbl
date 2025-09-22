import React, { useEffect, useState, useRef } from "react";

export default function RightSidebar({
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
}) {
  return (
    <div className="w-80 bg-gray-800 p-3 flex flex-col space-y-4 h-full overflow-y-auto">
      {/* Turn Status */}
      {activeUser && (
        <div className="bg-gray-700 p-2 rounded-lg">
          <h3 className="text-sm font-semibold text-green-400 mb-1">Current Turn</h3>
          <p className="text-white text-sm">
            {isMyTurn ? "Your turn!" : `${activeUser?.name || "Waiting..."}'s turn`}
          </p>
          
          {/* Turn Timer */}
          <div className="mt-2">
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  remainingTime > 10 ? 'bg-green-400' : 'bg-red-400'
                }`}
                style={{ width: `${(remainingTime / 30) * 100}%` }}
              ></div>
            </div>
            <p className="text-right text-xs text-gray-300 mt-1">
              {remainingTime}s left
            </p>
          </div>
        </div>
      )}

      {/* Canvas Background */}
      <div>
        <h3 className="text-md font-semibold mb-2">Canvas Background</h3>
        <div className="grid grid-cols-3 gap-2">
          {backgroundColors.map((bg, index) => (
            <div
              key={index}
              className={`h-12 rounded-lg cursor-pointer hover:opacity-80 border-2 ${
                canvasBackgroundColor === bg.color ? 'border-white' : 'border-gray-600'
              }`}
              style={{ backgroundColor: bg.color }}
              onClick={() => setCanvasBackgroundColor(bg.color)}
              title={bg.name}
            ></div>
          ))}
        </div>
      </div>

      {/* Pen Colors */}
      <div>
        <h3 className="text-md font-semibold mb-2">Pen Colors</h3>
        <div className="grid grid-cols-4 gap-2">
          {penColors.map((color, index) => (
            <button
              key={index}
              className={`w-6 h-6 rounded-full border-2 ${
                brushColor === color ? "border-white" : "border-gray-600"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setBrushColor(color)}
            />
          ))}
        </div>
      </div>

      {/* Custom Color */}
      <div>
        <h3 className="text-md font-semibold mb-2">Custom Color</h3>
        <input
          type="color"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
          className="w-full h-8 rounded border-0"
        />
      </div>

      {/* Brush Size */}
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
        <h3 className="text-md font-semibold mb-2">Participants</h3>
        <div className="flex -space-x-2">
          <img
            src="https://randomuser.me/api/portraits/men/32.jpg"
            alt="user"
            className="w-8 h-8 rounded-full border-2 border-gray-900"
          />
          <img
            src="https://randomuser.me/api/portraits/women/44.jpg"
            alt="user"
            className="w-8 h-8 rounded-full border-2 border-gray-900"
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
            className="bg-green-400 h-2 rounded-full"
            style={{ width: "70%" }} // static for now, can make dynamic
          ></div>
        </div>
        <p className="text-right text-sm text-gray-300 mt-1">15s left</p>
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