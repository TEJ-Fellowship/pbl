// Components/BookCard.jsx
import React from "react";
import {
  PencilSquareIcon,
  TrashIcon,
  HeartIcon,
} from "@heroicons/react/24/solid";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";

const BookCard = ({ book, onEdit, onDelete, onToggleFavorite }) => {
  // Check if this is an online book using your existing field names
  const isOnlineBook = book.source === "online" || book.googleId;

  return (
    <div className="border rounded-lg shadow p-4 bg-white dark:bg-gray-800 relative group">
      {/* Updated image display logic */}
      {book.coverImage ? (
        <img
          src={`http://localhost:3001/uploads/${book.coverImage}`}
          alt={book.title}
          className="w-full h-40 object-cover rounded"
          onError={(e) => {
            // Fallback if image fails to load
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      ) : null}

      {/* Fallback placeholder (shown when no image or image fails to load) */}
      <div
        className={`w-full h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded ${
          book.coverImage ? "hidden" : ""
        }`}
      >
        <span className="text-gray-500">No Cover</span>
      </div>

      <h2 className="text-lg font-semibold mt-2">{book.title}</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">{book.author}</p>
      <p className="text-sm">{book.genre.join(", ")}</p>
      <p className="text-sm">Year: {book.year}</p>
      <p className="text-sm">⭐ {book.rating}</p>
      {book.favorite && <p className="text-pink-500">❤️ Favorite</p>}

      {/* Show if it's from online source */}
      {isOnlineBook && (
        <p className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded mt-1">
          From Google Books
        </p>
      )}

      {/* Action buttons */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
        {/* Favorite button - available for all books */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(book);
          }}
          className={`p-1 rounded transition-colors ${
            book.favorite
              ? "bg-pink-500 text-white hover:bg-pink-600"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
          title={book.favorite ? "Remove from favorites" : "Add to favorites"}
        >
          {book.favorite ? (
            <HeartIcon className="w-4 h-4" />
          ) : (
            <HeartOutline className="w-4 h-4" />
          )}
        </button>

        {/* Edit button - only for manually added books */}
        {!isOnlineBook && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(book);
            }}
            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            title="Edit book"
          >
            <PencilSquareIcon className="w-4 h-4" />
          </button>
        )}

        {/* Delete button - only for manually added books */}
        {!isOnlineBook && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(book);
            }}
            className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            title="Delete book"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default BookCard;
