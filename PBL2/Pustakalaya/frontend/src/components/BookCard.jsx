// src/components/BookCard.jsx
import { Heart } from "lucide-react";

const BookCard = ({ book }) => {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-lg transition">
      {/* Cover area */}
      <div className="relative h-64 bg-gray-200">
        <img
          src={book.coverImage}
          alt={book.title}
          className="h-full w-full object-cover"
        />

        {/* Favorite icon */}
        <button
          type="button"
          //bg-white/90: white background with 90% opacity
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow"
        >
          <Heart
            size={18}
            className={
              book.isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
            }
          />
        </button>
      </div>

      {/* Text area */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900">{book.title}</h3>
        <p className="text-sm text-gray-600">{book.author}</p>
        {/* px: padding left and right, py: padding top and bottom, */}
        <span className="mt-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
          {book.category}
        </span>
      </div>
    </div>
  );
};

export default BookCard;
