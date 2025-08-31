import React from "react";

function JournalCard({ journal, onClick }) {
  return (
    <div
      className="w-full bg-white shadow-2xl rounded-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-200"
      onClick={onClick}
    >
      {/* Image Section */}
      <div className="h-[180px] bg-gray-100 flex items-center justify-center">
        <img
          src="/journalCard.png" 
          alt={journal.title}
          className="w-20 h-20 object-cover"
        />
      </div>

      {/* Text Section */}
      <div className="p-3">
        <h2 className="font-semibold text-gray-800 mb-1 line-clamp-2">{journal.title}</h2>
        <p className="text-sm text-gray-500">{journal.date}</p>
      </div>
    </div>
  );
}

export default JournalCard;