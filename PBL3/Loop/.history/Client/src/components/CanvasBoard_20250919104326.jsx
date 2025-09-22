// CanvasBoard.jsx (only the relevant parts shown / integrate into your component)
import React, { useRef, useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

export default function CanvasBoard({ brushColor, brushSize, tool, selectedShape, backgroundColor, roomId }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const socket = useSocket();
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;
  }, []);

  // Join the room on socket connection
  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit("join-room", { roomId }, (resp) => {
      if (!resp || !resp.ok) {
        console.error("Failed to join room:", resp?.message);
        return;
      }
      console.log("Joined room", resp.room);
    });

    socket.on("drawing", handleRemoteDrawing);
    socket.on("shape", handleRemoteShape);
    socket.on("clear-canvas", handleRemoteClear);
    socket.on("canvas-snapshot", ({ dataURL }) => {
      // load snapshot image onto canvas
      const img = new Image();
      img.onload = () => {
        const ctx = ctxRef.current;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
      };
      img.src = dataURL;
    });

    return () => {
      socket.off("drawing", handleRemoteDrawing);
      socket.off("shape", handleRemoteShape);
      socket.off("clear-canvas", handleRemoteClear);
      socket.off("canvas-snapshot");
    };
  }, [socket, roomId]);

  // Draw incoming stroke (simple line segment)
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
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.size;
    ctx.beginPath();
    // data should contain shape type and params (I assume same as stopDrawing builds)
    switch (data.shape) {
      case "circle":
        ctx.arc(data.cx, data.cy, data.r, 0, Math.PI * 2);
        break;
      case "square":
        ctx.rect(data.x, data.y, data.w, data.h);
        break;
      // triangle, star, hexagon etc. — reconstruct likewise
      default:
        break;
    }
    ctx.stroke();
    ctx.closePath();
  };

  const handleRemoteClear = () => {
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  // Start drawing
  const start = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    setIsDrawing(true);
    setLastPos({ x: offsetX, y: offsetY });
  };

  // Freehand draw + emit
  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const ctx = ctxRef.current;

    ctx.strokeStyle = tool === "eraser" ? backgroundColor : brushColor;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    ctx.closePath();

    // emit to room
    if (socket && socket.connected) {
      socket.emit("drawing", {
        tool,
        color: brushColor,
        size: brushSize,
        start: lastPos,
        end: { x: offsetX, y: offsetY },
      });
    }

    setLastPos({ x: offsetX, y: offsetY });
  };

  // Stop drawing: if shape tool, send shape details; also send a snapshot so new joiners can receive
  const end = ({ nativeEvent }) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === "shape") {
      // create shape data (example: circle)
      const { offsetX, offsetY } = nativeEvent;
      const w = offsetX - lastPos.x;
      const h = offsetY - lastPos.y;
      const shapeData = {
        shape: selectedShape,
        x: lastPos.x,
        y: lastPos.y,
        w,
        h,
        cx: lastPos.x + w / 2,
        cy: lastPos.y + h / 2,
        r: Math.abs(w) / 2,
        color: brushColor,
        size: brushSize,
      };
      // draw locally (you already do this in your original stopDrawing) and emit
      socket.emit("shape", shapeData);
    }

    // Send a snapshot so late joiners can get latest canvas
    try {
      const dataURL = canvasRef.current.toDataURL("image/png");
      socket.emit("canvas-snapshot", { dataURL });
    } catch (err) {
      console.warn("Failed to create snapshot:", err);
    }
  };

  // Clear for all
  const clearAll = () => {
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    socket && socket.emit("clear-canvas");
  };

  return (
    <div className="flex-1 ...">
      <canvas
        ref={canvasRef}
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={end}
        onMouseLeave={end}
        className="..."
      />
      <button onClick={clearAll}>Clear for All</button>
    </div>
  );
}
