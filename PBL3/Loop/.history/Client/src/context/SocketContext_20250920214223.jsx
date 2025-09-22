import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("🔑 Using token for socket:", token);

    const s = io("http://localhost:3001", {
      transports: ["websocket"],
      withCredentials: true,
      auth: { token },
    });

    s.on("connect", () => console.log("✅ Socket connected (client):", s.id));
    s.on("connect_error", (err) =>
      console.error("❌ Socket connect_error:", err.message)
    );

    setSocket(s);
    return () => s.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
