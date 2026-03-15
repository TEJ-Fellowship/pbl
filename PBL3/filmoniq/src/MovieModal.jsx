import React from "react";

const MovieModal = ({ movie, onClose, onAction, actionText, actionClass }) => {
  if (!movie) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
      onClick={onClose} // click outside closes modal
    >
      <div
        className="bg-[#141414] text-white rounded-lg p-6 max-w-3xl w-full overflow-y-auto relative flex gap-6"
        onClick={(e) => e.stopPropagation()} // prevent inner click closing
      >
        {/* Left: Poster */}
        {movie.poster_path && (
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            className="rounded-lg w-1/3 h-auto object-cover"
          />
        )}

        {/* Right: Details */}
        <div className="flex-1 flex flex-col">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-red-500 text-2xl"
          >
            ×
          </button>

          <h2 className="text-3xl font-bold mb-4">{movie.title}</h2>
          <p className="mb-2 font-medium">Rating: {movie.vote_average} ⭐</p>
          <p className="text-gray-300 mb-4">{movie.overview}</p>

          {/* Action button */}
          <button
            onClick={onAction}
            className={`w-full rounded-lg px-4 py-2 text-white transition-all duration-200 ${actionClass}`}
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieModal;
