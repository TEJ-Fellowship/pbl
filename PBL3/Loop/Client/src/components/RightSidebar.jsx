import React, { useEffect, useState, useRef } from "react";

export default function RightSidebar({
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  remainingTime,
  activeUser,
  user,
  canvasBackgroundColor,
  setCanvasBackgroundColor
}) {
  const isMyTurn = activeUser?.id === (user?.id || user?._id);

  const backgroundColors = [
    { color: "#ffffff", name: "White" },
    { color: "#f0f0f0", name: "Light Gray" },
    { color: "#ffe9e3", name: "Peach" },
    { color: "#e3f2fd", name: "Light Blue" },
    { color: "#f3e5f5", name: "Light Purple" },
    { color: "#e8f5e8", name: "Light Green" }
  ];

  const penColors = [
    "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00",
    "#ff00ff", "#00ffff", "#808080", "#800000", "#008000", "#000080"
  ];

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
        <h3 className="text-md font-semibold mb-2">Brush Size: {brushSize}px</h3>
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex items-center justify-center mt-2">
          <div
            className="rounded-full"
            style={{
              width: `${brushSize}px`,
              height: `${brushSize}px`,
              backgroundColor: brushColor,
              minWidth: '2px',
              minHeight: '2px'
            }}
          ></div>
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
      </div>
    </div>
  );
}