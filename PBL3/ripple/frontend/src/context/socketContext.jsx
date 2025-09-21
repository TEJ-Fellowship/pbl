import { useState, useEffect, createContext, useContext } from "react";
import { socket } from "../utils/socket";
import { useAuth } from "../context/authContext.jsx";
import { toast } from "react-toastify";
const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const userData = useAuth();
  const [notifications, setNotifications] = useState([]);

  const fetchNotification = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/notifications", {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();
      console.log(data);
      setNotifications(data);
    } catch (error) {
      console.error("Error on fetching data", error.message);
    }
  };

  useEffect(() => {
    fetchNotification();

    if (!userData) return;

    socket.on("rippleNotification", (data) => {
      console.log("global", data);
      setNotifications((prev) => [
        {
          userId: data.userId,
          message: data.message,
          fromUserId: data.fromUserId,
          fromUsername: data.fromUsername,
          type: "global_ripple",
          rippleId: data.rippleId,
        },
        ...prev,
      ]);
    });

    socket.on("sendRippleFriends", (data) => {
      if (data.fromUserId !== userData.user.userId) {
        toast.success(`${data.fromUsername} ${data.message}`);
      }
      console.log("friend", data);
      setNotifications((prev) => [
        {
          userId: data.userId,
          message: data.message,
          fromUserId: data.fromUserId,
          rippleId: data.rippleId,
          fromUsername: data.fromUsername,
          type: "friend_ripple",
        },
        ...prev,
      ]);
    });

    return () => {
      socket.off("rippleNotification");
      socket.off("sendRippleFriends");
    };
  }, [userData]);

  return (
    <SocketContext.Provider value={{ notifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
