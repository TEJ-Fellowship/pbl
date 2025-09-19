//Components/Feed.jsx
import React from "react";
import axios from "axios";
const Feed = ({ clips, setClips }) => {
  const handleReactions = async (clipId, type) => {
    console.log("Clicked", clipId, type);
    try {
      const token = localStorage.getItem("token");
      console.log("Token:", token);
      const res = await axios.patch(
        `http://localhost:3001/api/clips/${clipId}/reactions`,
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Response:", res.data); // check if backend actually returns updated clip
      setClips((prev) =>
        prev.map((clip) => (clip._id === clipId ? res.data : clip))
      );
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
      setClips((prev) => prev.filter((clip) => clip._id !== clipId));
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
                👍 {clip.reactions.like}
              </button>
              <button onClick={() => handleReactions(clip._id, "love")}>
                ❤️ {clip.reactions.love}
              </button>
              <button onClick={() => handleReactions(clip._id, "haha")}>
                😂 {clip.reactions.haha}
              </button>
              <button onClick={() => handleReactions(clip._id, "wow")}>
                😮 {clip.reactions.wow}
              </button>
              <button onClick={() => handleReactions(clip._id, "sad")}>
                😢 {clip.reactions.sad}
              </button>
              <button onClick={() => handleReactions(clip._id, "angry")}>
                😡 {clip.reactions.angry}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feed;
