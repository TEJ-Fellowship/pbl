import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { initSocket } from "../socket";
import { FiTrash2 } from "react-icons/fi";
import { useAlert } from "./useAlert";
import { useConfirm } from "./useConfirm";

// Custom Audio Player Component
const AudioPlayer = ({ src, clipId }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const formatTime = (time) => {
    if (!time || isNaN(time) || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    const dur = audioRef.current.duration;
    if (!isNaN(dur) && isFinite(dur)) {
      setDuration(dur);
    } else {
      setDuration(0); // fallback
    }
    setIsLoading(false);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  // Generate animated bars for waveform
  const waveformBars = Array.from({ length: 20 }, (_, i) => (
    <div
      key={i}
      className={`w-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-full transition-all duration-150 ${
        isPlaying ? "animate-pulse" : ""
      }`}
      style={{
        height: `${Math.random() * 20 + 8}px`,
        animationDelay: `${i * 50}ms`,
        opacity: isPlaying && currentTime > 0 ? 0.8 : 0.3,
      }}
    />
  ));

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="relative w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-white rounded-full"></div>
              <div className="w-1 h-4 bg-white rounded-full"></div>
            </div>
          ) : (
            <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
          )}

          {/* Ripple effect */}
          <div
            className={`absolute inset-0 rounded-full bg-white/20 scale-0 group-active:scale-110 transition-transform duration-200`}
          ></div>
        </button>

        <div className="flex-1">
          {/* Waveform visualization */}
          <div className="flex items-end justify-center gap-1 h-8 mb-2">
            {waveformBars}
          </div>

          {/* Progress bar */}
          <div
            className="w-full h-2 bg-slate-700 rounded-full cursor-pointer overflow-hidden"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-100 relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"></div>
            </div>
          </div>

          {/* Time display */}
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Animated Reaction Component
const ReactionButton = ({ type, count, onReact, isActive }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState([]);

  const emojis = {
    like: "👍",
    love: "❤️",
    haha: "😂",
    wow: "😮",
    sad: "😢",
    angry: "😡",
  };

  const handleClick = () => {
    setIsAnimating(true);

    // Create particle effect
    const newParticles = Array.from({ length: 3 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 20 - 10,
      y: Math.random() * 10 + 10,
    }));

    setParticles(newParticles);
    onReact();

    // Clean up animation
    setTimeout(() => {
      setIsAnimating(false);
      setParticles([]);
    }, 1000);
  };

  return (
    <div className="relative">
      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute pointer-events-none text-lg animate-bounce"
          style={{
            left: `${particle.x}px`,
            bottom: `${particle.y}px`,
            animation: "float-up 1s ease-out forwards",
          }}
        >
          {emojis[type]}
        </div>
      ))}

      <button
        onClick={handleClick}
        className={`
          relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium
          ${
            isActive
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
              : "bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 hover:text-white"
          }
          ${isAnimating ? "scale-110" : "hover:scale-105"}
          backdrop-blur-sm border border-white/10 hover:border-white/20
        `}
      >
        <span className={`text-base ${isAnimating ? "animate-bounce" : ""}`}>
          {emojis[type]}
        </span>
        <span
          className={`transition-all duration-300 ${
            isAnimating ? "scale-125 font-bold" : ""
          }`}
        >
          {count || 0}
        </span>

        {/* Glow effect */}
        {isActive && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 opacity-20 blur-md"></div>
        )}
      </button>

      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-40px) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

let currentUserId = null;
const token = localStorage.getItem("token");
if (token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    currentUserId = payload.id || payload.userId || null;
  } catch (err) {
    console.error("Failed to decode token", err);
  }
}

const Feed = ({ clips, setClips }) => {
  const { showAlert, AlertComponent } = useAlert();
  const { confirm, ConfirmComponent } = useConfirm();

  useEffect(() => {
    const socket = initSocket();

    socket.on("connect", () =>
      console.log("Socket connected (Feed):", socket.id)
    );

    socket.on("feedClipUpdated", (updatedClip) => {
      const ownerId = updatedClip.userId ? String(updatedClip.userId) : null;
      const clipWithOwner = {
        ...updatedClip,
        isOwner: ownerId === String(currentUserId),
      };
      setClips((prev) =>
        prev.map((c) => (c._id === clipWithOwner._id ? clipWithOwner : c))
      );
    });

    socket.on("feedClipAdded", (newClip) => {
      setClips((prev) => {
        if (prev.some((c) => c._id === newClip._id)) return prev;
        const ownerId = newClip.userId ? String(newClip.userId) : null;
        return [
          { ...newClip, isOwner: ownerId === String(currentUserId) },
          ...prev,
        ];
      });
    });

    socket.on("clipDeleted", (clipId) => {
      setClips((prev) => prev.filter((c) => c._id !== clipId));
    });

    return () => {
      socket.off("connect");
      socket.off("feedClipUpdated");
      socket.off("feedClipAdded");
      socket.off("clipDeleted");
    };
  }, [setClips]);

  const handleReactions = async (clipId, type) => {
    try {
      const tokenLocal = localStorage.getItem("token");
      const res = await axios.patch(
        `http://localhost:3001/api/clips/${clipId}/reactions`,
        { type },
        { headers: { Authorization: `Bearer ${tokenLocal}` } }
      );
      const updatedClip = res.data;
      const ownerId = updatedClip.userId ? String(updatedClip.userId) : null;
      setClips((prev) =>
        prev.map((clip) =>
          clip._id === clipId
            ? { ...updatedClip, isOwner: ownerId === String(currentUserId) }
            : clip
        )
      );
    } catch (error) {
      console.error("Reaction failed:", error);
      showAlert("Failed to send reaction", "error");
    }
  };

  const handleDelete = async (clipId) => {
    const confirmed = await confirm(
      "Are you sure you want to delete this clip?"
    );
    if (!confirmed) return;

    try {
      const tokenLocal = localStorage.getItem("token");
      await axios.delete(`http://localhost:3001/api/clips/${clipId}`, {
        headers: { Authorization: `Bearer ${tokenLocal}` },
      });
      setClips((prev) => prev.filter((clip) => clip._id !== clipId));
      showAlert("Clip deleted successfully!", "success");
    } catch (error) {
      console.error("Delete failed:", error);
      showAlert("Failed to delete clip", "error");
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6 text-white bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
        Latest Confessions
      </h2>
      <div className="flex flex-col gap-6">
        {clips.map((clip, index) => (
          <div
            key={clip._id}
            className="group p-6 border border-white/10 rounded-2xl shadow-xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm relative hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10"
            style={{
              animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
            }}
          >
            {/* Owner badge and delete button */}
            {/* Owner / Anonymous badge at top-right */}
            <div className="absolute top-4 right-4 z-10">
              <span
                className={`px-3 py-1 text-lg rounded-full backdrop-blur-sm ${
                  clip.isOwner
                    ? "bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-300 border border-yellow-500/20"
                    : "bg-gradient-to-r from-slate-600/30 to-slate-700/30 text-gray-300 border border-gray-500/20"
                }`}
              >
                {clip.isOwner ? "👑" : "👤"}
              </span>
            </div>

            {/* Audio Player */}
            <div className="mb-6">
              <AudioPlayer src={clip.url} clipId={clip._id} />
            </div>

            {/* Reactions + Trash */}
            <div className="flex justify-between items-center mt-4">
              {/* Reactions */}
              <div className="flex flex-wrap gap-3">
                {["like", "love", "haha", "wow", "sad", "angry"].map((r) => (
                  <ReactionButton
                    key={r}
                    type={r}
                    count={clip.reactions?.[r] ?? 0}
                    onReact={() => handleReactions(clip._id, r)}
                    isActive={false}
                  />
                ))}
              </div>

              {/* Trash button only if owner (hidden until hover) */}
              {clip.isOwner && (
                <button
                  onClick={() => handleDelete(clip._id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-600/20 transition-all duration-300 hover:scale-110"
                >
                  <FiTrash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

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
      `}</style>
      {AlertComponent}
      {ConfirmComponent}
    </div>
  );
};

export default Feed;
