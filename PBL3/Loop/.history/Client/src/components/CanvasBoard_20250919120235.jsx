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
  const [cursors, setCursors] = useState({}); // { socketId: {x, y} }

  // Canvas setup
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
      canvas.width = window.innerWidth - leftWidth - rightWidth - 520;
      canvas.height = window.innerHeight - 20;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [backgroundColor]);

  // Socket setup
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit("join-room", { roomId }, (resp) => {
      if (!resp?.ok) console.error("Failed to join room:", resp?.message);
    });

    socket.on("drawing", handleRemoteDrawing);
    socket.on("shape", handleRemoteShape);
    socket.on("clear-canvas", handleRemoteClear);
    socket.on("canvas-snapshot", handleRemoteSnapshot);
    socket.on("cursor", handleRemoteCursor);

    return () => {
      socket.off("drawing", handleRemoteDrawing);
      socket.off("shape", handleRemoteShape);
      socket.off("clear-canvas", handleRemoteClear);
      socket.off("canvas-snapshot", handleRemoteSnapshot);
      socket.off("cursor", handleRemoteCursor);
    };
  }, [socket, roomId]);

  // Mouse / touch drawing
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

      socket?.connected &&
        socket.emit("drawing", {
          tool,
          color: brushColor,
          size: brushSize,
          start: startPos,
          end: { x: offsetX, y: offsetY },
        });

      setStartPos({ x: offsetX, y: offsetY });
    }

    // send cursor position
    socket?.connected &&
      socket.emit("cursor", { x: offsetX, y: offsetY });
  };

  const stopDrawing = ({ nativeEvent }) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const ctx = ctxRef.current;
    const { offsetX, offsetY } = nativeEvent;

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
      socket?.connected && socket.emit("shape", shapeData);
    }

    if (tool === "pen" || tool === "eraser") ctx.closePath();

    // emit snapshot for late joiners
    if (socket?.connected) {
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
      default:
        break;
    }
    ctx.stroke();
    ctx.closePath();
  };

  // ---------------- Remote handlers ----------------
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

  const handleRemoteSnapshot = ({ dataURL }) => {
    if (!dataURL) return;
    const img = new Image();
    img.onload = () =>
      ctxRef.current.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
    img.src = dataURL;
  };

  const handleRemoteCursor = ({ id, x, y }) => {
    setCursors((prev) => ({ ...prev, [id]: { x, y } }));
  };

  // ---------------- Clear button ----------------
  const clearAll = () => {
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    socket?.emit("clear-canvas");
  };

  // ---------------- Render ----------------
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 relative">
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
      {/* Render cursors */}
      {Object.entries(cursors).map(([id, pos]) => (
        <div
          key={id}
          style={{
            position: "absolute",
            left: pos.x,
            top: pos.y,
            width: 10,
            height: 10,
            backgroundColor: "red",
            borderRadius: "50%",
            pointerEvents: "none",
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}
