// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const s = io("http://localhost:3001", {
      auth: {
        token, // new socket.io v4 can use auth
      },
      query: {
        token, // send as query for compatibility with earlier example if you use handshake.query
      },
      withCredentials: true,
    });

    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
