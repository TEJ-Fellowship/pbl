import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import Recorder from "../../Components/Recorder";
import axios from "axios";
const RoomChatPage = () => {
  const [messages, setMessages] = useState([]);
  const { id } = useParams();

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:3001/api/rooms/${id}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(res.data);
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const handleSend = async (clipId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:3001/api/rooms/${id}/messages`,
        { clipId, roomId: id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchMessages();
      setMessages((prev) => [...prev, res.data]);
    } catch (error) {
      console.log("Failed to send message");
    }
  };

  const handleMessageDelete = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this clip?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await axios.delete(
        `http://localhost:3001/api/rooms/${id}/messages/${messageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
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
          <div key={idx} className="p-3 border rounded">
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
