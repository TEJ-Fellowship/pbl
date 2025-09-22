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
  const startPosRef = useRef(null);

  // ------------------ Canvas setup ------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    const resizeCanvas = () => {
      const targetWidth = window.innerWidth - 40;
      const targetHeight = window.innerHeight - 40;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(targetWidth * dpr);
      canvas.height = Math.floor(targetHeight * dpr);

      canvas.style.width = `${targetWidth}px`;
      canvas.style.height = `${targetHeight}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
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

    socket.on("canvas-snapshot", ({ dataURL }) => {
      if (!dataURL) return;
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        ctxRef.current.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
      };
      img.src = dataURL;
    });

    socket.on("drawing", (data) => {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;
      const startX = data.start.x * canvas.clientWidth;
      const startY = data.start.y * canvas.clientHeight;
      const endX = data.end.x * canvas.clientWidth;
      const endY = data.end.y * canvas.clientHeight;

      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.size;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.closePath();
    });

    return () => {
      socket.off("canvas-snapshot");
      socket.off("drawing");
    };
  }, [socket, roomId]);

  // ------------------ Drawing handlers ------------------
  const toRelative = (x, y) => {
    const canvas = canvasRef.current;
    return { x: x / canvas.clientWidth, y: y / canvas.clientHeight };
  };

  const startDrawing = (e) => {
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    setIsDrawing(true);
    startPosRef.current = { x, y };
  };

  const draw = (e) => {
    if (!isDrawing || !ctxRef.current) return;
    const ctx = ctxRef.current;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(startPosRef.current.x, startPosRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();

    if (socket && socket.connected) {
      socket.emit("drawing", {
        start: toRelative(startPosRef.current.x, startPosRef.current.y),
        end: toRelative(x, y),
        color: brushColor,
        size: brushSize,
        roomId,
      });
    }

    startPosRef.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (socket && socket.connected) {
      const dataURL = canvasRef.current.toDataURL("image/png");
      socket.emit("canvas-snapshot", { dataURL, roomId });
    }
  };

  const clearAll = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    if (socket && socket.connected) socket.emit("clear-canvas", { roomId });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-900">
      <canvas
        ref={canvasRef}
        className="bg-white rounded-lg shadow-lg cursor-crosshair"
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      />
      <button
        onClick={clearAll}
        className="mt-4 px-4 py-2 bg-red-500 rounded-lg hover:bg-red-400"
      >
        Clear for All
      </button>
    </div>
  );
}
