import { useState } from "react";
import { getShelfItems, removeShelfItem } from "../utils/shelfStorage";

const MyShelf = () => {
  const [items, setItems] = useState(() => getShelfItems());

  const handleRemove = (id) => {
    const updatedItems = removeShelfItem(id);
    setItems(updatedItems);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-gray-900">My Shelf</h1>
      <p className="mt-1 text-sm text-gray-600">
        Books you borrow appear here (saved on this device for now).
      </p>

      {items.length === 0 ? (
        <p className="mt-8 text-gray-600">
          Your shelf is empty. Borrow a book from Home.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((book) => (
            <li
              key={book.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <img
                src={book.coverImage}
                alt=""
                className="h-52 w-full object-cover"
              />
              <div className="p-4">
                <h2 className="font-serif font-semibold text-gray-900 line-clamp-2">
                  {book.title}
                </h2>
                <p className="mt-1 text-sm text-gray-600">by {book.author}</p>

                {/* REMOVE BUTTON */}
                <button
                  onClick={() => handleRemove(book.id)}
                  className="mt-4 w-full rounded-lg bg-red-50 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                >
                  Return Book
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};

export default MyShelf;
