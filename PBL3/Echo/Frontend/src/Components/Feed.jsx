import React from "react";
const dummyClips = [
  {
    id: 1,
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    reactions: 3,
  },
  {
    id: 2,
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    reactions: 7,
  },
];
const Feed = () => {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Latest Confessions</h2>
      <div className="flex flex-col gap-4">
        {dummyClips.map((clip) => (
          <div
            key={clip.id}
            className="p-4 border rounded-lg shadow-sm bg-white"
          >
            <audio controls src="{clip.url}" className="w-full"></audio>
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-1 bg-pink-500 text-white rounded-r-lg">
                ❤️ {clip.reactions}
              </button>
              <button className="px-3 py-1 bg-yellow-500 text-white rounded-r-lg">
                😂
              </button>
              <button className="px-3 py-1 bg-blue-500 text-white rounded-r-lg">
                😢
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
