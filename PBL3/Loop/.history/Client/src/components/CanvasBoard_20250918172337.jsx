import React, { useRef, useEffect, useState } from "react";

export default function CanvasBoard({
  brushColor,
  brushSize,
  tool,
  selectedShape,
  backgroundColor,
  setBackgroundColor, // need to update background from backend
}) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(null); // Offscreen canvas to store sketch
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);

  // Resize canvas dynamically
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const leftSidebar = document.getElementById("left-sidebar");
    const rightSidebar = document.getElementById("right-sidebar");

    const leftWidth = leftSidebar ? leftSidebar.offsetWidth : 0;
    const rightWidth = rightSidebar ? rightSidebar.offsetWidth : 0;

    canvas.width = window.innerWidth - leftWidth - rightWidth - 520;
    canvas.height = window.innerHeight - 20;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctxRef.current = ctx;

    if (!drawingRef.current) {
      drawingRef.current = document.createElement("canvas");
      drawingRef.current.width = canvas.width;
      drawingRef.current.height = canvas.height;
    }

    redrawCanvas(backgroundColor);
  };

  const redrawCanvas = (bgColor) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (drawingRef.current) {
      ctx.drawImage(drawingRef.current, 0, 0);
    }
  };

  // Load canvas & background from backend
  useEffect(() => {
    const loadCanvas = async () => {
      try {
        const res = await fetch("/api/getCanvas");
        const data = await res.json();

        if (data?.image) {
          const img = new Image();
          img.src = data.image;
          img.onload = () => {
            const ctx = canvasRef.current.getContext("2d");
            ctx.fillStyle = data.backgroundColor || "#ffffff";
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.drawImage(img, 0, 0);

            // Save to offscreen for future redraws
            drawingRef.current.getContext("2d").drawImage(img, 0, 0);

            // Update parent background state
            setBackgroundColor(data.backgroundColor || "#ffffff");
          };
        }
      } catch (err) {
        console.error("Error loading canvas:", err);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    loadCanvas();

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Update brush style
  useEffect(() => {
    if (!ctxRef.current) return;
    ctxRef.current.strokeStyle = tool === "pen" ? brushColor : "#ffffff";
    ctxRef.current.lineWidth = brushSize;
  }, [brushColor, brushSize, tool]);

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

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;

    if (tool === "pen" || tool === "eraser") {
      ctxRef.current.lineTo(offsetX, offsetY);
      ctxRef.current.stroke();
    }
  };

  const stopDrawing = ({ nativeEvent }) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    if (tool === "pen" || tool === "eraser") {
      ctx.closePath();
    } else if (tool === "shape" && startPos) {
      const { offsetX, offsetY } = nativeEvent;
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
          drawHexagon(ctx, startPos.x + w / 2, startPos.y + h / 2, 6, Math.abs(w) / 2);
          break;
      }

      ctx.stroke();
      ctx.closePath();
    }

    // Save current sketch to offscreen
    drawingRef.current.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    drawingRef.current.getContext("2d").drawImage(canvas, 0, 0);

    saveCanvasToBackend();
  };

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

  const drawHexagon = (ctx, cx, cy, sides, outerRadius) => {
    const angle = (2 * Math.PI) / sides;
    ctx.moveTo(cx + outerRadius * Math.cos(0), cy + outerRadius * Math.sin(0));
    for (let i = 1; i <= sides; i++) {
      ctx.lineTo(cx + outerRadius * Math.cos(i * angle), cy + outerRadius * Math.sin(i * angle));
    }
    ctx.closePath();
  };

  const saveCanvasToBackend = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL("image/png");

    try {
      await fetch("/api/saveCanvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataURL, backgroundColor }),
      });
    } catch (err) {
      console.error("Error saving canvas:", err);
    }
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
    </div>
  );
}
