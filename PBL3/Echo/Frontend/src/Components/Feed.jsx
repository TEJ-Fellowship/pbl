// frontend/Components/Feed.jsx
import React, { useEffect } from "react";
import axios from "axios";
import { initSocket } from "../socket";

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
  useEffect(() => {
    const socket = initSocket();

    socket.on("connect", () =>
      console.log("Socket connected (Feed):", socket.id)
    );

    // When server broadcasts an updated clip (sanitized), compute owner locally
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

    // When server announces a new clip, dedupe and compute isOwner locally
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

  // handleReactions and handleDelete unchanged except ensure when you update local UI
  // you compute isOwner for the returned clip as well (in case server response lacks it)
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
      // No client emit needed if server emits feedClipUpdated
    } catch (error) {
      console.error("Reaction failed:", error);
      alert("Failed to send reaction");
    }
  };

  const handleDelete = async (clipId) => {
    if (!window.confirm("Delete this clip?")) return;
    try {
      const tokenLocal = localStorage.getItem("token");
      await axios.delete(`http://localhost:3001/api/clips/${clipId}`, {
        headers: { Authorization: `Bearer ${tokenLocal}` },
      });
      setClips((prev) => prev.filter((clip) => clip._id !== clipId));
      // server should emit clipDeleted; if not, can emit client-side
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete clip");
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Latest Confessions</h2>
      <div className="flex flex-col gap-4">
        {clips.map((clip) => (
          <div
            key={clip._id}
            className="p-4 border rounded-lg shadow-sm bg-white relative"
          >
            <audio controls src={clip.url} className="w-full" />
            {clip.isOwner && (
              <div className="absolute top-2 right-2 flex gap-2 items-center">
                <span className="px-2 py-1 text-xs bg-green-200 text-green-800 rounded">
                  Your Clip
                </span>
                <button
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                  onClick={() => handleDelete(clip._id)}
                >
                  🗑️ Delete
                </button>
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <button onClick={() => handleReactions(clip._id, "like")}>
                👍 {clip.reactions?.like ?? 0}
              </button>
              <button onClick={() => handleReactions(clip._id, "love")}>
                ❤️ {clip.reactions?.love ?? 0}
              </button>
              <button onClick={() => handleReactions(clip._id, "haha")}>
                😂 {clip.reactions?.haha ?? 0}
              </button>
              <button onClick={() => handleReactions(clip._id, "wow")}>
                😮 {clip.reactions?.wow ?? 0}
              </button>
              <button onClick={() => handleReactions(clip._id, "sad")}>
                😢 {clip.reactions?.sad ?? 0}
              </button>
              <button onClick={() => handleReactions(clip._id, "angry")}>
                😡 {clip.reactions?.angry ?? 0}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feed;
