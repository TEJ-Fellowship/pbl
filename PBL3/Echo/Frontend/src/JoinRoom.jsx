// src/JoinRoom.jsx

import React, { useState } from "react";
import { joinRoom } from "../socket";

import React from "react";

const JoinRoom = () => {
  const [roomId, setRoomId] = useState("");
  const handleJoin = () => {
    if (roomId.trim() !== "") {
      joinRoom(roomId);
      alert(`Joined Room:${roomId}`);
      setRoomId("");
    }
  };
  return (
    <div className="join-room">
      <input
        type="text"
        value={roomId}
        placeholder="Enter Room ID"
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={handleJoin}>Join Room</button>
    </div>
  );
};

export default JoinRoom;
