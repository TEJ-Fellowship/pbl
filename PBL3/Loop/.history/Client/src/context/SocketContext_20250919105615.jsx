// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const s = io("http://localhost:3001", {
      auth: { token },
      query: { token }, // backend checks both
      withCredentials: true,
    });
    s.on("connect", () => {
  console.log("✅ Connected to socket server:", s.id);
});

s.on("disconnect", () => {
  console.log("❌ Disconnected from socket server");
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
