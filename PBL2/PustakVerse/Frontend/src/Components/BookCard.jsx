// Components/BookCard.jsx
import React from "react";
// MODIFIED: Updated icons import to use solid icons
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/solid";

// MODIFIED: Added onEdit and onDelete props
const BookCard = ({ book, onEdit, onDelete }) => (
  <div className="border rounded-lg shadow p-4 bg-white dark:bg-gray-800 relative group">
    {/* {book.cover ? (
      <img
        src={URL.createObjectURL(book.cover)}
        alt={book.title}
        className="w-full h-40 object-cover rounded"
      />
    ) : ( */}
    <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded">
      No Cover
    </div>
    {/* )} */}
    <h2 className="text-lg font-semibold mt-2">{book.title}</h2>
    <p className="text-sm text-gray-600 dark:text-gray-400">{book.author}</p>
    <p className="text-sm">{book.genre.join(", ")}</p>
    <p className="text-sm">Year: {book.year}</p>
    <p className="text-sm">⭐ {book.rating}</p>
    {book.favorite && <p className="text-pink-500">❤️ Favorite</p>}

    {/* MODIFIED: Moved Edit and Delete buttons to bottom right */}
    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent modal from opening
          onEdit(book);
        }}
        className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        title="Edit book"
      >
        <PencilSquareIcon className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent modal from opening
          onDelete(book);
        }}
        className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        title="Delete book"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export default BookCard;
