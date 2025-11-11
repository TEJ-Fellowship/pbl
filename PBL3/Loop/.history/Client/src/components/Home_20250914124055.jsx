import React, { useState } from "react";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import CanvasBoard from "./CanvasBoard";
import Navbar from "./Navbar"; // <-- import navbar

export default function HomePage() {
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState("pen");

  return (
    <div className="flex flex-col h-screen bg-gray-100"
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex flex-1">
        <LeftSidebar setTool={setTool} />

        <CanvasBoard
          brushColor={brushColor}
          brushSize={brushSize}
          tool={tool}
        />

        <RightSidebar
          brushColor={brushColor}
          setBrushColor={setBrushColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
        />
      </div>
    </div>
  );
}
