import React, { useRef, useEffect, useState } from "react";
import { PenTool, Image, Circle, Square, BarChart2 } from "lucide-react";

export default function HomePage() {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Resize canvas to fill container
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY
    );
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineTo(
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY
    );
    ctx.stroke();
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar */}
      <div className="w-16 bg-gray-900 flex flex-col items-center py-4 space-y-4">
        <button className="p-2 hover:bg-gray-700 rounded">
          <PenTool className="text-white" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded">
          <Image className="text-white" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded">
          <Circle className="text-white" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded">
          <Square className="text-white" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded">
          <BarChart2 className="text-white" />
        </button>
      </div>

      {/* Center Drawing Canvas */}
      <div className="flex-1 flex justify-center items-center bg-white relative">
        <canvas
          ref={canvasRef}
          className="border border-gray-300 w-full h-full max-w-4xl max-h-full"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400">
          Your doodle canvas
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4 flex flex-col space-y-6">
        {/* Stylize Section */}
        <div>
          <h3 className="font-semibold mb-2">Stylize</h3>
          <div className="flex space-x-2">
            <button className="px-2 py-1 bg-gray-700 rounded">Default</button>
            <button className="px-2 py-1 bg-gray-700 rounded">Pixel</button>
            <button className="px-2 py-1 bg-gray-700 rounded">Anime</button>
          </div>
        </div>

        {/* Background Section */}
        <div>
          <h3 className="font-semibold mb-2">Background</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-400 h-16 w-16 rounded"></div>
            <div className="bg-yellow-400 h-16 w-16 rounded"></div>
            <div className="bg-red-400 h-16 w-16 rounded"></div>
          </div>
        </div>

        {/* Participants Section */}
        <div>
          <h3 className="font-semibold mb-2">Participants</h3>
          <div className="flex -space-x-2">
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt=""
              className="w-10 h-10 rounded-full border-2 border-gray-800"
            />
            <img
              src="https://randomuser.me/api/portraits/women/44.jpg"
              alt=""
              className="w-10 h-10 rounded-full border-2 border-gray-800"
            />
          </div>
          <p className="mt-2">Liam Carter - Current Turn</p>
        </div>

        {/* Turn Timer */}
        <div>
          <h3 className="font-semibold mb-2">Turn Timer</h3>
          <div className="w-full bg-gray-700 h-2 rounded">
            <div className="bg-green-500 h-2 rounded w-1/2"></div>
          </div>
          <p className="mt-1 text-sm text-gray-400">15s left</p>
        </div>
      </div>
    </div>
  );
}
