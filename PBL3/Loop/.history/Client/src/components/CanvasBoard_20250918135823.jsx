import React, { useRef, useEffect, useState } from "react";

export default function CanvasBoard({ brushColor, brushSize, tool, selectedShape }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [snapshot, setSnapshot] = useState(null);


  // Resize the canvas dynamically
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const leftSidebar = document.getElementById("left-sidebar");
    const rightSidebar = document.getElementById("right-sidebar");

    const leftWidth = leftSidebar ? leftSidebar.offsetWidth : 0;
    const rightWidth = rightSidebar ? rightSidebar.offsetWidth : 0;

    canvas.width = window.innerWidth - leftWidth - rightWidth - 520;
    canvas.height = window.innerHeight - 20;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    resizeCanvas();
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctxRef.current = ctx;

    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  useEffect(() => {
    if (!ctxRef.current) return;
    ctxRef.current.strokeStyle = tool === "pen" ? brushColor : "#ffffff";
    ctxRef.current.lineWidth = brushSize;
  }, [brushColor, brushSize, tool]);

  // Start drawing or shape placement
  const startDrawing = ({ nativeEvent }) => {
    
    const { offsetX, offsetY } = nativeEvent;

    if (tool === "pen" || tool === "eraser") {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(offsetX, offsetY);
      setIsDrawing(true);
    } else if (tool === "shape") {
      setStartPos({ x: offsetX, y: offsetY });
      setIsDrawing(true);
    }
  };

  // Freehand drawing
  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;

    if (tool === "pen" || tool === "eraser") {
      ctxRef.current.lineTo(offsetX, offsetY);
      ctxRef.current.stroke();
    }
  };

  // Stop drawing and finalize shapes
  const stopDrawing = ({ nativeEvent }) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === "pen" || tool === "eraser") {
      ctxRef.current.closePath();
      return;
    }

    if (tool === "shape" && startPos) {
      const { offsetX, offsetY } = nativeEvent;
      const ctx = ctxRef.current;
      ctx.beginPath();
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;

      const w = offsetX - startPos.x;
      const h = offsetY - startPos.y;

      switch (selectedShape) {
        case "circle":
          ctx.arc(startPos.x + w / 2, startPos.y + h / 2, Math.abs(w) / 2, 0, 2 * Math.PI);
          break;
        case "square":
          ctx.rect(startPos.x, startPos.y, w, h);
          break;
        case "triangle":
          ctx.moveTo(startPos.x + w / 2, startPos.y);
          ctx.lineTo(startPos.x, startPos.y + h);
          ctx.lineTo(startPos.x + w, startPos.y + h);
          ctx.closePath();
          break;
        case "star":
          drawStar(ctx, startPos.x + w / 2, startPos.y + h / 2, 5, Math.abs(w) / 2, Math.abs(w) / 4);
          break;
        case "hexagon":
          drawhexagon(ctx, startPos.x + w/2, startPos.y +h / 2, )
        default:
          break;
      }

      ctx.stroke();
      ctx.closePath();
    }
  };

  // Helper: draw a star
  const drawStar = (ctx, cx, cy, spikes, outerRadius, innerRadius) => {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  };

  // Save canvas to localStorage gallery
  const saveCanvas = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/png");

    const savedImages = JSON.parse(localStorage.getItem("galleryImages") || "[]");
    savedImages.push(dataURL);
    localStorage.setItem("galleryImages", JSON.stringify(savedImages));
    alert("Canvas saved to gallery!");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-900">
      <canvas
        ref={canvasRef}
        className="bg-white rounded-lg shadow-lg cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <button
        onClick={saveCanvas}
        className="mt-4 bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-300 shadow"
      >
        Save to Gallery
      </button>
    </div>
  );
}
