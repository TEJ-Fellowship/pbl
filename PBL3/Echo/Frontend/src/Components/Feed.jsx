// frontend/Components/Feed.jsx
import React, { useEffect } from "react";
import axios from "axios";
import { initSocket } from "../socket"; // must match your frontend/socket.js

const Feed = ({ clips, setClips }) => {
  useEffect(() => {
    const socket = initSocket();

    // debug: ensure socket connected
    socket.on("connect", () => {
      console.log("Socket connected (Feed):", socket.id);
    });

    // Server-driven: when server broadcasts an updated clip after DB save
    socket.on("feedClipUpdated", (updatedClip) => {
      console.log("feedClipUpdated received in Feed:", updatedClip);
      setClips((prev) =>
        prev.map((c) => (c._id === updatedClip._id ? updatedClip : c))
      );
    });

    socket.on("feedClipAdded", (newClip) => {
      setClips((prev) => {
        // Skip if already exists
        if (prev.some((c) => c._id === newClip._id)) return prev;

        // Compute isOwner dynamically
        const currentUserId = localStorage.getItem("userId");
        return [
          { ...newClip, isOwner: newClip.userId === currentUserId },
          ...prev,
        ];
      });
    });
    // Server-driven: when a clip is deleted
    socket.on("clipDeleted", (clipId) => {
      console.log("clipDeleted received in Feed:", clipId);
      setClips((prev) => prev.filter((c) => c._id !== clipId));
    });

    // cleanup listeners to avoid duplicates
    return () => {
      socket.off("connect");
      socket.off("feedClipUpdated");
      socket.off("feedClipAdded");
      socket.off("clipDeleted");
    };
  }, [setClips]);

  const handleReactions = async (clipId, type) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `http://localhost:3001/api/clips/${clipId}/reactions`,
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedClip = res.data;

      // Update sender UI immediately
      setClips((prev) =>
        prev.map((clip) => (clip._id === clipId ? updatedClip : clip))
      );

      // IMPORTANT: DO NOT emit here if your server already emits inside the PATCH route.
      // If your server is broadcasting (io.emit('feedClipUpdated', updatedClip)), no client emit required.
      // If your server is NOT broadcasting, uncomment the next 2 lines:
      // const socket = initSocket();
      // socket.emit("clipReacted", updatedClip);
    } catch (error) {
      console.error("Reaction failed:", error);
      alert("Failed to send reaction");
    }
  };

  const handleDelete = async (clipId) => {
    if (!window.confirm("Delete this clip?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3001/api/clips/${clipId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // update local UI for sender
      setClips((prev) => prev.filter((clip) => clip._id !== clipId));

      // If server emits 'clipDeleted' inside the delete route, no client emit needed.
      // Otherwise you can emit like:
      // const socket = initSocket(); socket.emit("clipDeleted", clipId);
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
            <audio controls src={clip.url} className="w-full"></audio>
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
