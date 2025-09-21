import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Recorder from "../../Components/Recorder";
import axios from "axios";
import { initSocket, joinRoom, leaveRoom } from "../../socket";
import { FiTrash2, FiMic, FiArrowLeft } from "react-icons/fi";
import { useAlert } from "../../Components/useAlert";
import { useConfirm } from "../../Components/useConfirm";

const RoomChatPage = () => {
  const [messages, setMessages] = useState([]);
  const { id } = useParams(); // this is the roomId
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();
  const { confirm, ConfirmComponent } = useConfirm();

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

    if (!socket.connected) {
      socket.once("connect", () => joinRoom(id));
    } else {
      joinRoom(id);
    }

    fetchMessages();

    socket.on("newMessage", (msg) => {
      console.log("socket newMessage received:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("roomMessageDeleted", (messageId) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    });

    return () => {
      leaveRoom(id);
      socket.off("newMessage");
      socket.off("connect");
    };
  }, [id]);

  const handleSend = async (clipOrId) => {
    try {
      const clipId = typeof clipOrId === "string" ? clipOrId : clipOrId?._id;
      if (!clipId) {
        console.error("handleSend: no clipId provided", clipOrId);
        return showAlert("Failed to send: invalid clip");
      }

      console.log("handleSend: sending clipId=", clipId, "roomId=", id);

      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:3001/api/rooms/${id}/messages`,
        { clipId, roomId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const socket = initSocket();
      socket.emit("message", { ...res.data, roomId: id });

      setMessages((prev) => [...prev, res.data]);
    } catch (error) {
      console.error(
        "Failed to send message:",
        error.response?.data || error.message
      );
      showAlert(
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
      showAlert(
        "Failed to delete message: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleBack = async () => {
    if (
      await confirm(
        "Are you sure you want to leave the room? Unsaved recordings will be lost."
      )
    ) {
      navigate(-1); // Go back to previous page
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header with Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition"
          >
            <FiArrowLeft size={18} />
            Back
          </button>

          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Room Confessions
          </h2>
        </div>

        {/* Messages Container */}
        <div className="bg-gradient-to-br from-slate-900/30 to-slate-800/30 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl mb-8 overflow-hidden">
          <div className="max-h-[750px] overflow-y-auto p-6 space-y-4">
            <div className="messages flex flex-col gap-4">
              {messages.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-32 h-32 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/10">
                    <FiMic size={50} color="white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    No confessions yet
                  </h3>
                  <p className="text-gray-400 text-lg mb-8">
                    Be the first to share your thoughts in this room.
                    <br />
                    Your voice matters here.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-indigo-400">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"></div>
                    <span className="text-sm">
                      Waiting for the first confession...
                    </span>
                  </div>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div
                    key={m._id ?? idx}
                    className={`
                      group relative p-6 rounded-2xl shadow-xl transition-all duration-500 border backdrop-blur-sm 
                      hover:scale-[1.02] hover:shadow-2xl
                      ${
                        m.isOwner
                          ? "bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-500/30 ml-8 hover:shadow-indigo-500/20"
                          : "bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-white/10 mr-8 hover:shadow-white/10"
                      }
                    `}
                    style={{
                      animation: `slideInUp 0.6s ease-out ${idx * 0.1}s both`,
                    }}
                  >
                    {/* Background glow */}
                    <div
                      className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                        m.isOwner
                          ? "bg-gradient-to-r from-indigo-600/10 to-purple-600/10"
                          : "bg-gradient-to-r from-slate-600/10 to-slate-500/10"
                      }`}
                    />

                    <div className="flex flex-col relative z-10">
                      {/* User indicator */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                              m.isOwner
                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                : "bg-gradient-to-r from-slate-600 to-slate-700 text-gray-200"
                            }`}
                          >
                            {m.isOwner ? "👑" : "👤"}
                          </div>
                          <div>
                            <span
                              className={`font-semibold ${
                                m.isOwner ? "text-indigo-300" : "text-gray-300"
                              }`}
                            >
                              {m.isOwner ? "You" : "Anonymous"}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date().toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Delete button with react-icons */}
                        {m.isOwner && (
                          <button
                            onClick={() => handleMessageDelete(m._id)}
                            className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-600/20 transition-all duration-300 hover:scale-110"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        )}
                      </div>

                      {/* Audio Player */}
                      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                        <audio
                          controls
                          src={m.clipUrl}
                          className="w-full h-12 rounded-lg bg-slate-700/50 border border-white/10"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <Recorder onSave={handleSend} roomId={id} />
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {AlertComponent};
      {ConfirmComponent};
    </div>
  );
};

export default RoomChatPage;
