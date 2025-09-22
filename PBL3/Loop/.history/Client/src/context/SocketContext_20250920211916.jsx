import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("⚠️ No token found in localStorage");
      return;
    }

    // ✅ Only use auth for passing token
    const s = io("http://localhost:3001", {
      auth: { token },
      withCredentials: true,
    });

    s.on("connect", () => {
      console.log("✅ Connected to socket:", s.id);
    });

    s.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
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
