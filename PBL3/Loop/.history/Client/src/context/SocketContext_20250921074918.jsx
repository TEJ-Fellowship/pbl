// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const s = io(backendUrl, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      console.log("✅ Socket connected:", s.id);
    });

    s.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
