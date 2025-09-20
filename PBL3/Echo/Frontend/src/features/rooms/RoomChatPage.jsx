// frontend/features/rooms/RoomChatPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Recorder from "../../Components/Recorder";
import axios from "axios";
import { initSocket, joinRoom, leaveRoom } from "../../socket";

const RoomChatPage = () => {
  const [messages, setMessages] = useState([]);
  const { id } = useParams(); // this is the roomId

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:3001/api/rooms/${id}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(res.data);
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  };

  useEffect(() => {
    const socket = initSocket();

    // ensure socket connected then join room
    if (!socket.connected) {
      socket.once("connect", () => joinRoom(id));
    } else {
      joinRoom(id);
    }

    fetchMessages();

    // listen for new message broadcasts
    socket.on("newMessage", (msg) => {
      console.log("socket newMessage received:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("roomMessageDeleted", (messageId) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    });

    // cleanup on unmount
    return () => {
      leaveRoom(id);
      socket.off("newMessage");
      socket.off("connect");
    };
  }, [id]);

  const handleSend = async (clipOrId) => {
    try {
      // accept either a clip object or a string id
      const clipId = typeof clipOrId === "string" ? clipOrId : clipOrId?._id;

      if (!clipId) {
        console.error("handleSend: no clipId provided", clipOrId);
        return alert("Failed to send: invalid clip");
      }

      console.log("handleSend: sending clipId=", clipId, "roomId=", id);

      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:3001/api/rooms/${id}/messages`,
        { clipId, roomId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // emit to socket so room peers see it in real time
      const socket = initSocket();
      socket.emit("message", { ...res.data, roomId: id });

      // append the returned message locally
      setMessages((prev) => [...prev, res.data]);
    } catch (error) {
      console.error(
        "Failed to send message:",
        error.response?.data || error.message
      );
      alert(
        "Failed to send message: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleMessageDelete = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this clip?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(
        `http://localhost:3001/api/rooms/${id}/messages/${messageId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchMessages();
    } catch (error) {
      alert(
        "Failed to delete message: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-4">
      <h2 className="text-xl font-bold mb-4">Room Confessions 🎙️</h2>

      <div className="messages mb-6 flex flex-col gap-3">
        {messages.map((m, idx) => (
          <div key={m._id ?? idx} className="p-3 border rounded">
            <div className="flex flex-col">
              <span className="font-semibold">
                {m.isOwner ? "You" : "Anonymous"}
              </span>
              <audio controls src={m.clipUrl} className="mt-2 w-full" />
            </div>

            {m.isOwner && (
              <button
                onClick={() => handleMessageDelete(m._id)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 ml-2"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      <Recorder onSave={handleSend} roomId={id} />
    </div>
  );
};

export default RoomChatPage;
