// Components/BookModal.jsx
import React from "react";

const BookModal = ({ book, onClose }) => {
  if (!book) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 rounded-2xl p-6 max-w-3xl w-full overflow-y-auto flex flex-col md:flex-row gap-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Cover Image */}
        <div className="w-full md:w-1/3 h-auto min-h-[200px] flex items-center justify-center">
          {book.coverImage ? (
            <img
              src={`http://localhost:3001/uploads/${book.coverImage}`}
              alt={book.title}
              className="w-full h-auto max-h-96 object-cover rounded-lg shadow-md"
              onError={(e) => {
                if (book.coverUrl) {
                  e.target.src = book.coverUrl;
                } else {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }
              }}
            />
          ) : book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-auto max-h-96 object-cover rounded-lg shadow-md"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}

          {/* Fallback placeholder */}
          <div
            className={`w-full h-64 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-600 ${
              book.coverImage || book.coverUrl ? "hidden" : ""
            }`}
          >
            <span className="text-gray-500">No Cover</span>
          </div>
        </div>

        {/* Right: Book Details */}
        <div className="flex-1 flex flex-col relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 bg-white dark:bg-gray-800 rounded-full shadow-md p-3 text-red-500 text-xl hover:text-red-600 transition-colors"
          >
            ×
          </button>

          {/* Source indicator */}
          {book.source === "google" && (
            <span className="self-start mb-3 bg-primary/90 text-white text-xs font-medium px-2 py-1 rounded-full shadow-sm">
              Online
            </span>
          )}
          {book.source === "manual" && (
            <span className="self-start mb-3 bg-gray-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow-sm">
              Manual
            </span>
          )}

          {/* Title & Author */}
          <h2 className="text-2xl md:text-3xl font-bold mb-1 leading-snug pr-8">
            {book.title}
          </h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4">
            by <span className="font-medium">{book.author}</span>
          </p>

          {/* Metadata */}
          <div className="flex flex-wrap gap-3 text-sm mb-4">
            {book.genre?.length > 0 && (
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300">
                {book.genre.join(", ")}
              </span>
            )}
            {book.year && (
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300">
                {book.year}
              </span>
            )}
            {book.rating > 0 && (
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-700 text-yellow-700 dark:text-yellow-200 rounded-full">
                ⭐ {book.rating}
              </span>
            )}
            {book.favorite && (
              <span className="px-3 py-1 bg-pink-100 dark:bg-pink-700 text-pink-600 dark:text-pink-200 rounded-full">
                ❤️ Favorite
              </span>
            )}
          </div>

          {/* Description */}
          <div className="mt-2 max-w-full md:max-w-[500px] space-y-2">
            <p className="font-semibold text-base border-b border-gray-200 dark:border-gray-700 pb-1">
              Description
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
              {book.description || "No description provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookModal;
