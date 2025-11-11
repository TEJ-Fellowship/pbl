import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000"); // your backend URL

export default function Canvas({ roomCode }) {
  const canvasRef = useRef();

  useEffect(() => {
    // Join the room when component mounts
    socket.emit("joinRoom", roomCode);

    // Listen for updates from other users
    socket.on("canvasUpdate", (data) => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(data.x1, data.y1);
      ctx.lineTo(data.x2, data.y2);
      ctx.stroke();
    });

    return () => {
      socket.off("canvasUpdate");
    };
  }, [roomCode]);
