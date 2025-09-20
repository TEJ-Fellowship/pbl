//features/rooms/RoomsPage.jsx
import React, { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios, { AxiosHeaders } from "axios";

import {
  fetchRooms,
  createRoom,
  joinRoom,
  selectRooms,
  selectRoomsStatus,
} from "./roomsSlice";
import Navbar from "../../Components/Navbar.jsx";
import { initSocket } from "../../socket.js";
const RoomsPage = ({ setIsLoggedIn }) => {
  const dispatch = useDispatch();
  const rooms = useSelector(selectRooms);
  const roomsRef = useRef(rooms);
  const status = useSelector(selectRoomsStatus);
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newPass, setNewPass] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);
  // decode token to get current user id
  let currentUserId = null;
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      currentUserId = payload.id || payload.userId || null;
    } catch (err) {
      console.warn("Failed to decode token in RoomsPage", err);
    }
  }
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchRooms());
    }
  }, [dispatch, status]);

  useEffect(() => {
    const socket = initSocket();

    socket.on("connect", () => {
      console.log("RoomsPage socket connected:", socket.id);
    });

    socket.on("roomCreated", (room) => {
      // Defensive: room.userId must be present (string) from server
      const isOwner =
        !!room.userId && String(room.userId) === String(currentUserId);

      dispatch({
        type: "rooms/createRoom/fulfilled",
        payload: { ...room, isOwner },
      });
    });

    socket.on("roomDeleted", (roomId) => {
      console.log("socket roomDeleted:", roomId);
      dispatch(fetchRooms());
    });

    return () => {
      socket.off("connect");
      socket.off("roomCreated");
      socket.off("roomDeleted");
    };
  }, [dispatch, currentUserId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName || !newPass) return alert("Name and password required");
    try {
      await dispatch(createRoom({ name: newName, password: newPass })).unwrap(); //unwrap converts the promise to value
      setNewName("");
      setNewPass("");
    } catch (err) {
      alert("Create failed: " + (err.message || JSON.stringify(err)));
    }
  };

  const handleJoin = async (roomId, roomName) => {
    const password = window.prompt(`Enter password to join "${roomName}"`);
    if (!password) return;

    try {
      await dispatch(joinRoom({ roomId, password })).unwrap();
      alert("Joined room!");
      navigate(`/rooms/${roomId}`);
    } catch (err) {
      alert("Join failed: " + (err.message || JSON.stringify(err)));
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete the room?")) return;
    const token = localStorage.getItem("token");
    const res = await axios.delete(
      `http://localhost:3001/api/rooms/${roomId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    dispatch(fetchRooms());

    try {
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.error || err.message));
    }
  };

  const filtered = rooms.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div className="max-w-2xl mx-auto mt-8 p-4">
      <Navbar setIsLoggedIn={setIsLoggedIn} />
      <h1 className="text-2xl mb-4">Rooms</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search rooms..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          placeholder="Room name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="p-2 border rounded flex-1"
        />
        <input
          placeholder="Password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          className="p-2 border rounded w-48"
        />
        <button type="submit" className="px-4 bg-green-600 text-white rounded">
          Create
        </button>
      </form>

      {status === "loading" && <p>Loading rooms...</p>}

      <div className="flex flex-col gap-3">
        {filtered.map((room) => (
          <div
            key={room._id}
            className="p-3 border rounded flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{room.name}</div>
              <div className="text-xs text-gray-500">
                Created: {new Date(room.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="flex gap-2 items-center">
              {room.isOwner && (
                <>
                  <span className="text-xs px-2 py-1 bg-blue-100 rounded">
                    Your room
                  </span>
                  <button
                    onClick={() => handleDeleteRoom(room._id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </>
              )}
              <button
                onClick={() => handleJoin(room._id, room.name)}
                className="px-3 py-1 border rounded"
              >
                Join
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomsPage;
