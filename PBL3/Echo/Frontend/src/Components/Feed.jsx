import React from "react";

const Feed = ({ clips }) => {
  const handleReactions = (clipId, type) => {
    console.log("React", clipId, type);
  };
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Latest Confessions</h2>
      <div className="flex flex-col gap-4">
        {clips.map((clip) => (
          <div
            key={clip.id}
            className="p-4 border rounded-lg shadow-sm bg-white"
          >
            <audio controls src={clip.url} className="w-full"></audio>
            <div className="flex gap-2 mt-2">
              <button
                className="px-3 py-1 bg-pink-500 text-white rounded-r-lg"
                onClick={() => handleReactions(clip.id, "heart")}
              >
                ❤️ {clip.reactions.heart}
              </button>
              <button
                className="px-3 py-1 bg-yellow-500 text-white rounded-r-lg"
                onClick={() => handleReactions(clip.id, "happy")}
              >
                😂 {clip.reactions.happy}
              </button>
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded-r-lg"
                onClick={() => handleReactions(clip.id, "sad")}
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
