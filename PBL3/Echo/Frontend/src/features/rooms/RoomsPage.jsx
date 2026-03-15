import React, { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiTrash2, FiHome, FiLock, FiUserPlus, FiUsers } from "react-icons/fi";
import {
  fetchRooms,
  createRoom,
  joinRoom,
  selectRooms,
  selectRoomsStatus,
} from "./roomsSlice";
import Navbar from "../../Components/Navbar.jsx";
import { initSocket } from "../../socket.js";
import { useAlert } from "../../Components/useAlert";
import { useConfirm } from "../../Components/useConfirm.jsx";


// Enhanced Room Card Component
const RoomCard = ({ room, onJoin, onDelete, currentUserId }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [joinAnimation, setJoinAnimation] = useState(false);

  const handleJoinClick = () => {
    setJoinAnimation(true);
    setTimeout(() => {
      onJoin(room._id, room.name);
      setJoinAnimation(false);
    }, 300);
  };

  const memberCount = Math.floor(Math.random() * 15) + 1; // Simulated member count
  const isActive = Math.random() > 0.5; // Simulated activity status

  return (
    <div
      className={`
        group relative p-6 bg-gradient-to-br from-slate-900/95 to-slate-800/95 
        backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl 
        transition-all duration-500 hover:scale-105 hover:shadow-2xl 
        hover:shadow-indigo-500/20 cursor-pointer
        ${isHovered ? "border-indigo-500/50" : ""}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Activity Indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-gray-500"
            }`}
        />
        <span
          className={`text-xs font-medium ${isActive ? "text-green-400" : "text-gray-400"
            }`}
        >
          {isActive ? "Active" : "Quiet"}
        </span>
      </div>

      {/* Owner Badge */}
      {room.isOwner && (
        <div className="absolute top-4 right-4">
          <div className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 text-xs font-semibold rounded-full border border-yellow-500/30 backdrop-blur-sm">
            👑 Your Room
          </div>
        </div>
      )}

      {/* Room Content */}
      <div className="relative z-10 mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {room.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
              {room.name}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <FiUsers size={14} /> {memberCount} members
              </span>
            </div>
          </div>
        </div>

        {/* Room Stats */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 p-3 bg-slate-800/50 rounded-xl border border-white/5">
            <div className="text-2xl font-bold text-indigo-400">
              {Math.floor(Math.random() * 50) + 10}
            </div>
            <div className="text-xs text-gray-400">Confessions</div>
          </div>
          <div className="flex-1 p-3 bg-slate-800/50 rounded-xl border border-white/5">
            <div className="text-2xl font-bold text-purple-400">
              {Math.floor(Math.random() * 200) + 50}
            </div>
            <div className="text-xs text-gray-400">Reactions</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleJoinClick}
            disabled={joinAnimation}
            className={`
              flex-1 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 
              text-white font-semibold rounded-xl shadow-lg transition-all duration-300
              hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/25
              disabled:opacity-50 disabled:cursor-not-allowed
              ${joinAnimation ? "animate-pulse" : ""}
            `}
          >
            {joinAnimation ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Joining...
              </div>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <FiUserPlus size={18} /> Join Room
              </span>
            )}
          </button>

          {room.isOwner && (
            <button
              onClick={() => onDelete(room._id)}
              className="p-3 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-xl transition-all duration-300 hover:scale-110 border border-red-500/20"
            >
              <FiTrash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Floating particles on hover */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-indigo-400 rounded-full opacity-60 animate-ping"
              style={{
                left: `${20 + i * 15}%`,
                top: `${20 + (i % 2) * 60}%`,
                animationDelay: `${i * 200}ms`,
                animationDuration: "2s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Create Room Modal Component
const CreateRoomModal = ({
  isOpen,
  onClose,
  onSubmit,
  newName,
  setNewName,
  newPass,
  setNewPass,
}) => {
  const [step, setStep] = useState(1);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const strength =
      newPass.length > 0 ? Math.min((newPass.length / 8) * 100, 100) : 0;
    setPasswordStrength(strength);
  }, [newPass]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newName || !newPass) return;

    setIsCreating(true);
    try {
      await onSubmit(e);
      setStep(1);
      setIsCreating(false);
      onClose();
    } catch (err) {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiHome size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Create New Room
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Build your confession space
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter room name..."
              className="w-full p-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Set a secure password..."
              className="w-full p-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
            />

            {/* Password Strength Indicator */}
            {newPass && (
              <div className="mt-2">
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrength < 50
                        ? "bg-red-500"
                        : passwordStrength < 75
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
                <p
                  className={`text-xs mt-1 ${passwordStrength < 50
                      ? "text-red-400"
                      : passwordStrength < 75
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                >
                  {passwordStrength < 50
                    ? "Weak"
                    : passwordStrength < 75
                      ? "Good"
                      : "Strong"}{" "}
                  password
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-slate-700/50 text-gray-300 font-semibold rounded-xl transition-all duration-300 hover:bg-slate-600/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newName || !newPass || isCreating}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                "Create Room"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Password Prompt Modal
const PasswordModal = ({ isOpen, onClose, onSubmit, roomName }) => {
  const [password, setPassword] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;

    setIsJoining(true);
    try {
      await onSubmit(password);
      setPassword("");
      setIsJoining(false);
      onClose();
    } catch (err) {
      setIsJoining(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Join "{roomName}"
          </h2>
          <p className="text-gray-400 text-sm">Enter the room password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Room password..."
            autoFocus
            className="w-full p-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-slate-700/50 text-gray-300 font-semibold rounded-xl transition-all duration-300 hover:bg-slate-600/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!password || isJoining}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Joining...
                </div>
              ) : (
                "Join"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RoomsPage = ({ setIsLoggedIn }) => {
  const dispatch = useDispatch();
  const rooms = useSelector(selectRooms);
  const roomsRef = useRef(rooms);
  const status = useSelector(selectRoomsStatus);
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newPass, setNewPass] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    roomId: null,
    roomName: "",
  });
  const navigate = useNavigate();

  const { showAlert, AlertComponent } = useAlert();
  const { confirm, ConfirmComponent } = useConfirm();

  useEffect(() => {
    showAlert("Welcome back to the rooms page!", "info");
  }, []);
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  // decode token
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
    if (status === "idle") dispatch(fetchRooms());
  }, [dispatch, status]);

  useEffect(() => {
    const socket = initSocket();

    socket.on("connect", () =>
      console.log("RoomsPage socket connected:", socket.id)
    );

    socket.on("roomCreated", (room) => {
      const isOwner =
        !!room.userId && String(room.userId) === String(currentUserId);
      dispatch({
        type: "rooms/createRoom/fulfilled",
        payload: { ...room, isOwner },
      });
    });

    socket.on("roomDeleted", () => dispatch(fetchRooms()));

    return () => {
      socket.off("connect");
      socket.off("roomCreated");
      socket.off("roomDeleted");
    };
  }, [dispatch, currentUserId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName || !newPass) return showAlert("Please fill in both Room Name and Password", "warning");
    try {
      await dispatch(createRoom({ name: newName, password: newPass })).unwrap();
      showAlert("Room created successfully!", "success");
      setNewName("");
      setNewPass("");
    } catch (err) {
      showAlert("Create failed: " + (err.message || JSON.stringify(err)), "error");
    }
  };

  const handleJoin = async (roomId, roomName) => {
    setPasswordModal({ isOpen: true, roomId, roomName });
  };

  const handlePasswordSubmit = async (password) => {
    try {
      await dispatch(
        joinRoom({ roomId: passwordModal.roomId, password })
      ).unwrap();
      showAlert("Joined room successfully!", "success");
      navigate(`/rooms/${passwordModal.roomId}`);
    } catch (err) {
      showAlert("Join failed: " + (err.message || JSON.stringify(err)), "error");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    const confirmed = await confirm("Are you sure you want to delete the room?");
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:3001/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showAlert("Room deleted successfully!", "success");
      dispatch(fetchRooms());
    } catch (err) {
      showAlert("Delete failed: " + (err.response?.data?.error || err.message), "error");
    }
  };

  const filtered = rooms.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      <Navbar setIsLoggedIn={setIsLoggedIn} />

      <main className="max-w-6xl mx-auto mt-6 px-4 pb-6">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Confession Rooms
          </h1>
          <p className="text-gray-400 text-lg">
            Join conversations or create your own private space
          </p>
        </div>

        {/* Search and Create Section */}
        <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/10 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
              <input
                type="text"
                placeholder="Search rooms..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>

            {/* Create Room Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/25 flex items-center gap-3"
            >
              Create Room
            </button>
          </div>
        </div>

        {/* Loading State */}
        {status === "loading" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-800/50 rounded-2xl p-6 animate-pulse"
              >
                <div className="h-6 bg-slate-700 rounded mb-4"></div>
                <div className="h-4 bg-slate-700 rounded mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Rooms Grid */}
        {status !== "loading" && (
          <>
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((room, index) => (
                  <div
                    key={room._id}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    className="animate-fadeInUp"
                  >
                    <RoomCard
                      room={room}
                      onJoin={handleJoin}
                      onDelete={handleDeleteRoom}
                      currentUserId={currentUserId}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🏠</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  No rooms found
                </h3>
                <p className="text-gray-400 mb-8">
                  {query
                    ? "Try adjusting your search terms"
                    : "Be the first to create a room!"}
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/25"
                >
                  Create First Room
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        newName={newName}
        setNewName={setNewName}
        newPass={newPass}
        setNewPass={setNewPass}
      />

      <PasswordModal
        isOpen={passwordModal.isOpen}
        onClose={() =>
          setPasswordModal({ isOpen: false, roomId: null, roomName: "" })
        }
        onSubmit={handlePasswordSubmit}
        roomName={passwordModal.roomName}
      />

      <style jsx>{`
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
      {AlertComponent}
      {ConfirmComponent}
    </div>
  );
};

export default RoomsPage;
