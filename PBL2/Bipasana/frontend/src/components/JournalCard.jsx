import React, { useMemo } from "react";

function JournalCard({ journal, onClick }) {
  // Extract first image from journal content
  const firstImage = useMemo(() => {
    if (!journal.content) return null;

    const div = document.createElement("div");
    div.innerHTML = journal.content;
    const img = div.querySelector("img");
    return img ? img.src : null;
  }, [journal.content]);

  return (
    <div
      className="w-[320px] bg-white shadow-2xl rounded-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
      onClick={onClick}
    >
      {/* Image Section */}
      <div className="h-[180px] bg-gray-100 flex items-center justify-center overflow-hidden">
        <div className="w-[240px] h-[140px] overflow-hidden rounded-lg shadow-md">
          <img
            src={firstImage || "/default.jpg"}
            alt={journal.title}
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
          />
        </div>


      </div>

      {/* Text Section */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-800">{journal.title}</h2>
          {journal.mood && (
            <span className="text-xl" title={journal.mood.label}>
              {journal.mood.symbol} {journal.mood.label}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">{journal.createdAt}</p>
      </div>
    </div>
  );
}

export default JournalCard;