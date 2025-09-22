import React, { useState, useEffect } from "react";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import CanvasBoard from "./CanvasBoard";

export default function HomePage() {
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState("pen"); // default tool
  const [selectedShape, setSelectedShape] = useState("circle");
  const [backgroundColor, setBackgroundColor] = usestate('#ffffff');

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Left Sidebar */}
      <LeftSidebar tool={tool} setTool={setTool} selectedShape={selectedShape} setSelectedShape={setSelectedShape} />

      {/* Canvas Board */}
      <CanvasBoard
        brushColor={brushColor}
        brushSize={brushSize}
        tool={tool}
        selectedShape={selectedShape}
        backgroundColor={backgroundColor}
      />

      {/* Right Sidebar */}
      <RightSidebar
        brushColor={brushColor}
        setBrushColor={setBrushColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
      />
    </div>
  );
}
