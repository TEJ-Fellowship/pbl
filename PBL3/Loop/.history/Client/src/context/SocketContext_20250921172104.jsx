import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token"); // use localStorage
    if (!token) return;

    const s = io("http://localhost:3001", {
      auth: { token },
    });

    s.on("connect", () => console.log("✅ Socket connected:", s.id));
    s.on("disconnect", () => console.log("❌ Socket disconnected"));

    setSocket(s);
    return () => s.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
