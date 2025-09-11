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
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Latest Confessions</h2>
      <div className="flex flex-col gap-4">
        {clips.map((clip) => (
          <div
            key={clip._id}
            className="p-4 border rounded-lg shadow-sm bg-white"
          >
            <audio controls src={clip.url} className="w-full"></audio>
            <div className="flex gap-2 mt-2">
              <button
                className="px-3 py-1 bg-pink-500 text-white rounded-r-lg"
                onClick={() => handleReactions(clip._id, "heart")}
              >
                ❤️ {clip.reactions.heart}
              </button>
              <button
                className="px-3 py-1 bg-yellow-500 text-white rounded-r-lg"
                onClick={() => handleReactions(clip._id, "laugh")}
              >
                😂 {clip.reactions.laugh}
              </button>
              <button
                className="px-3 py-1 bg-blue-500 text-white rhappyounded-r-lg"
                onClick={() => handleReactions(clip._id, "sad")}
              >
                😢 {clip.reactions.sad}
              </button>
              <button className="px-3 py-1 bg-gray-500 text-white rounded-r-lg">
                🚩
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feed;
