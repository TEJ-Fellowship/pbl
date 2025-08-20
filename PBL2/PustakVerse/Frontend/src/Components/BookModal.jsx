import React from "react";

const BookModal = ({ book, onClose }) => {
  if (!book) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-lg p-6 max-w-3xl w-full overflow-y-auto flex flex-col md:flex-row gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Cover Placeholder */}
        <div className="w-full md:w-1/3 h-auto min-h-[200px] bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded">
          <span className="text-gray-500">No Cover</span>
        </div>

        {/* Right: Book Details */}
        <div className="flex-1 flex flex-col relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-red-500 text-2xl"
          >
            ×
          </button>

          <h2 className="text-2xl font-bold mb-2">{book.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            by {book.author}
          </p>
          <p className="text-sm mb-1">Genres: {book.genre.join(", ")}</p>
          <p className="text-sm mb-2">Year: {book.year}</p>
          <p className="text-sm mb-2">⭐ {book.rating}</p>
          {book.favorite && <p className="text-pink-500 mb-2">❤️ Favorite</p>}

          {/* Description */}
          <div className="mt-2 max-w-full md:max-w-[500px]">
            <p className="font-semibold mb-1">Description</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
              {book.description || "No description provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookModal;
