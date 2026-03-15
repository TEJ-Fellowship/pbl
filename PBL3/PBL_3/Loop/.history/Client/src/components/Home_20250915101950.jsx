import React, { useState } from "react";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import CanvasBoard from "./CanvasBoard";

export default function Home() {
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState("pen");

  // Clear canvas handler (optional)
  const clearCanvas = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <LeftSidebar setTool={(t) => {
        if (typeof t === "object" && t.type === "color") {
          setBrushColor(t.value);
        } else {
          setTool(t);
        }
      }} />

      {/* Canvas */}
      <CanvasBoard
        brushColor={brushColor}
        brushSize={brushSize}
        tool={tool}
      />

      {/* Right Sidebar */}
      <RightSidebar
        brushColor={brushColor}
        setBrushColor={setBrushColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        clearCanvas={clearCanvas}
      />
    </div>
  );
}
