// Components/Home/BookCard.jsx
import React from "react";
import { TrashIcon, PencilSquareIcon } from "@heroicons/react/24/solid";

const BookCard = ({ book, onDelete, onEdit }) => {
  const handleDel = () => {
    if (onDelete) onDelete(book.id); // delete using id
  };

  const handleEdit = () => {
    if (onEdit) onEdit(book.id); // edit using id
  };

  return (
    <div className="max-w-80 border rounded-lg shadow p-4 bg-white dark:bg-gray-800 relative">
      {book.cover ? (
        <img
          src={URL.createObjectURL(book.cover)}
          alt={book.title}
          className="w-full h-40 object-cover rounded"
        />
      ) : (
        <div className="w-full h-80 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded">
        No Cover
        </div>
      )}

      <h2 className="text-lg font-semibold mt-2">{book.title}</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">{book.author}</p>
      <p className="text-sm">Genre: {book.genre.join(", ")}</p>
      <p className="text-sm">Year: {book.year}</p>
      <p className="text-sm">⭐ {book.rating}</p>
      {book.favorite && <p className="text-pink-500">❤️ Favorite</p>}

      {/* Delete Button */}
      <button
        onClick={handleDel}
        className="absolute bottom-2 right-2"
        title="Delete"
      >
        <TrashIcon className="h-6 w-6 text-gray-500" />
      </button>

      {/* Edit Button */}
      <button
        onClick={handleEdit}
        className="absolute bottom-2 right-10"
        title="Edit"
      >
        <PencilSquareIcon className="h-6 w-6 text-orange-500" />
      </button>
    </div>
  );
};

export default BookCard;
