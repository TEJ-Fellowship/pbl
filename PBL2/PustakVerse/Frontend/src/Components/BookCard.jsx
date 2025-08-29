// Components/BookCard.jsx
import React from "react";
import {
  PencilSquareIcon,
  TrashIcon,
  HeartIcon,
} from "@heroicons/react/24/solid";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import InsightsButton from "./InsightsButton";

const BookCard = ({ book, onEdit, onDelete, onToggleFavorite }) => {
  // Check if this is an online book using your existing field names
  const isOnlineBook = book.source === "online" || book.googleId;

  return (
    <div className="border rounded-2xl shadow-lg p-6 bg-white dark:bg-gray-800 relative flex flex-col justify-between min-h-[400px] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
      {/* Image */}
      {book.coverImage ? (
        <img
          src={`http://localhost:3001/uploads/${book.coverImage}`}
          alt={book.title}
          className="w-full h-48 object-cover rounded-xl shadow-lg mb-4 hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      ) : null}

      <div
        className={`w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-xl mb-4 ${
          book.coverImage ? "hidden" : ""
        }`}
      >
        <span className="text-gray-500">No Cover</span>
      </div>

      {/* Minimal Text */}
      <div>
        <h2 className="text-xl font-bold mb-1 truncate">{book.title}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">
          {book.author}
        </p>
        <p className="text-sm font-semibold">⭐ {book.rating}</p>

        <p className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded mt-2 inline-block">
          {isOnlineBook ? "Online" : "Manual"}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex flex-col gap-2">
        <InsightsButton
          book={book}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg font-semibold hover:scale-105 transition-transform duration-200"
        />

        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(book);
            }}
            className={`flex-1 p-2 rounded-full text-white ${
              book.favorite
                ? "bg-pink-500 hover:bg-pink-600"
                : "bg-gray-400 hover:bg-gray-500"
            } transition-colors hover:scale-105 duration-200`}
            title={book.favorite ? "Remove from favorites" : "Add to favorites"}
          >
            {book.favorite ? (
              <HeartIcon className="w-5 h-5 mx-auto" />
            ) : (
              <HeartOutline className="w-5 h-5 mx-auto" />
            )}
          </button>

          {!isOnlineBook && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(book);
              }}
              className="flex-1 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium"
              title="Edit book"
            >
              <PencilSquareIcon className="w-5 h-5 mx-auto" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(book);
            }}
            className="flex-1 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-medium"
            title="Delete book"
          >
            <TrashIcon className="w-5 h-5 mx-auto" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
