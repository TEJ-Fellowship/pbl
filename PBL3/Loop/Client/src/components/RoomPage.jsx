import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import CanvasBoard from "./CanvasBoard";

export default function RoomPage({ user }) {
  const { roomId } = useParams();
  const [socket, setSocket] = useState(null);

  const [players, setPlayers] = useState([]);
  const [activeUser, setActiveUser] = useState(null); // current turn
  const [remainingTime, setRemainingTime] = useState(30);
  const [isCreator, setIsCreator] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!roomId || !user) return;

    const newSocket = io("http://localhost:5000", { withCredentials: true });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      newSocket.emit("joinRoom", {
        roomId,
        userId: user._id,
        username: user.username || user.name,
      });
    });

    // Room users update
    newSocket.on("roomUsers", (roomUsers) => {
      setPlayers(roomUsers);
      const currentTurn = roomUsers.find(
        (u) => u.socketId === roomUsers[0]?.socketId
      );
      if (currentTurn) setActiveUser({ id: currentTurn.userId, name: currentTurn.username });
    });

    // Timer update
    newSocket.on("timerUpdate", (time) => {
      setRemainingTime(time);
    });

    // Turn update
    newSocket.on("turnUpdate", ({ userId, username }) => {
      setActiveUser({ id: userId, name: username });
      setRemainingTime(30);
    });

    return () => {
      newSocket.emit("leaveRoom", { roomId, userId: user._id });
      newSocket.disconnect();
    };
  }, [roomId, user]);

  // Only creator can toggle room (optional)
  const handleToggleRoom = () => {
    if (!isCreator) return;
    // emit some event to backend if needed
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-2">Room: {roomId}</h1>

      {isCreator && (
        <div className="mb-2">
          <p className="text-gray-400">Room Code: {roomId}</p>
          <button
            onClick={handleToggleRoom}
            className="bg-green-500 px-4 py-2 rounded mb-4"
          >
            {isActive ? "Deactivate Room" : "Activate Room"}
          </button>
        </div>
      )}

      {/* Timer + current drawer */}
      <div className="mb-4">
        <p className="font-semibold">
          {activeUser?.id === user._id
            ? "🎨 Your Turn to Draw!"
            : `Waiting for ${activeUser?.name || "someone"} to draw...`}
        </p>
        <p className="text-red-500">⏱️ {remainingTime}s</p>
      </div>

      {/* Canvas */}
      <div className="w-full flex-1 flex justify-center">
        <CanvasBoard
          brushColor="#000000"
          brushSize={3}
          tool="pen"
          roomId={roomId}
          user={user}
          activeUser={activeUser}
          setRemainingTime={setRemainingTime}
          socket={socket}
        />
      </div>
    </div>
  );
}
