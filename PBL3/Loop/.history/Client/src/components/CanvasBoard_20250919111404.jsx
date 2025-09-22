// CanvasBoard.jsx
import React, { useRef, useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

export default function CanvasBoard({
  brushColor,
  brushSize,
  tool,
  selectedShape,
  backgroundColor,
  roomId,
}) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const socket = useSocket();
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);

  // ------------------ Canvas setup ------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    const resizeCanvas = () => {
      const leftSidebar = document.getElementById("left-sidebar");
      const rightSidebar = document.getElementById("right-sidebar");
      const leftWidth = leftSidebar ? leftSidebar.offsetWidth : 0;
      const rightWidth = rightSidebar ? rightSidebar.offsetWidth : 0;
      canvas.width = window.innerWidth - leftWidth - rightWidth - 20;
      canvas.height = window.innerHeight - 20;

      // redraw background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [backgroundColor]);

  // ------------------ Socket setup ------------------
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit("join-room", { roomId }, (resp) => {
      if (!resp?.ok) console.error("Failed to join room:", resp?.message);
      else console.log("Joined room", resp.room);
    });

    socket.on("drawing", handleRemoteDrawing);
    socket.on("shape", handleRemoteShape);
    socket.on("clear-canvas", handleRemoteClear);
    socket.on("canvas-snapshot", ({ dataURL }) => {
      if (!dataURL) return;
      const img = new Image();
      img.onload = () => ctxRef.current.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
      img.src = dataURL;
    });

    return () => {
      socket.off("drawing", handleRemoteDrawing);
      socket.off("shape", handleRemoteShape);
      socket.off("clear-canvas", handleRemoteClear);
      socket.off("canvas-snapshot");
    };
  }, [socket, roomId]);

  // ------------------ Drawing functions ------------------
  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    setIsDrawing(true);
    setStartPos({ x: offsetX, y: offsetY });

    if (tool === "pen" || tool === "eraser") {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(offsetX, offsetY);
    }
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || !ctxRef.current) return;
    const { offsetX, offsetY } = nativeEvent;
    const ctx = ctxRef.current;

    if (tool === "pen" || tool === "eraser") {
      ctx.strokeStyle = tool === "eraser" ? backgroundColor : brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();

      // emit to other clients
      if (socket && socket.connected) {
        socket.emit("drawing", {
          tool,
          color: brushColor,
          size: brushSize,
          start: startPos,
          end: { x: offsetX, y: offsetY },
        });
      }

      setStartPos({ x: offsetX, y: offsetY });
    }
  };

  const stopDrawing = ({ nativeEvent }) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const ctx = ctxRef.current;
    const { offsetX, offsetY } = nativeEvent;

    // handle shape drawing
    if (tool === "shape" && startPos) {
      const w = offsetX - startPos.x;
      const h = offsetY - startPos.y;
      const shapeData = {
        shape: selectedShape,
        x: startPos.x,
        y: startPos.y,
        w,
        h,
        cx: startPos.x + w / 2,
        cy: startPos.y + h / 2,
        r: Math.abs(w) / 2,
        color: brushColor,
        size: brushSize,
      };

      drawShape(ctx, shapeData);
      if (socket && socket.connected) socket.emit("shape", shapeData);
    }

    if (tool === "pen" || tool === "eraser") ctx.closePath();

    // send snapshot for late joiners
    if (socket && socket.connected) {
      const dataURL = canvasRef.current.toDataURL("image/png");
      socket.emit("canvas-snapshot", { dataURL });
    }
  };

  const drawShape = (ctx, data) => {
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.size;
    ctx.beginPath();
    switch (data.shape) {
      case "circle":
        ctx.arc(data.cx, data.cy, data.r, 0, Math.PI * 2);
        break;
      case "square":
        ctx.rect(data.x, data.y, data.w, data.h);
        break;
      case "triangle":
        ctx.moveTo(data.x + data.w / 2, data.y);
        ctx.lineTo(data.x, data.y + data.h);
        ctx.lineTo(data.x + data.w, data.y + data.h);
        ctx.closePath();
        break;
      // add star, hexagon if needed
      default:
        break;
    }
    ctx.stroke();
    ctx.closePath();
  };

  const handleRemoteDrawing = (data) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.strokeStyle = data.tool === "eraser" ? backgroundColor : data.color;
    ctx.lineWidth = data.size;
    ctx.beginPath();
    ctx.moveTo(data.start.x, data.start.y);
    ctx.lineTo(data.end.x, data.end.y);
    ctx.stroke();
    ctx.closePath();
  };

  const handleRemoteShape = (data) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    drawShape(ctx, data);
  };

  const handleRemoteClear = () => {
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const clearAll = () => {
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    socket && socket.emit("clear-canvas");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-900">
      <canvas
        ref={canvasRef}
        id="canvas-board"
        className="bg-white rounded-lg shadow-lg cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <div className="mt-4 flex space-x-4">
        <button
          onClick={clearAll}
          className="bg-red-500 hover:bg-red-400 px-4 py-2 rounded-lg"
        >
          Clear for All
        </button>
      </div>
    </div>
  );
}
